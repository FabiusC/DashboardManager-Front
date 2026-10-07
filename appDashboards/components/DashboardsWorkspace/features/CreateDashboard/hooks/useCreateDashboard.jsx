import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from 'next/router';
import { useDynamicFormControls } from "@creangel/ifindit-ui/hooks";
import { pushNotification } from "@redux/actions";
import { useAppId } from 'hooks/useAppId';
import { handleCreateItemEntityWithResponse } from '@helpers/dashboardAPI/genericRequest';
import { getAclById } from '@services/creangelAuthAPI';
import { getBaseFormFields, getDataSourcesList, groupConfig } from '../utils/formConfig';
import { buildCategoryPayload } from '../utils/categoryUtils';
import { handleUpdateDashboardCategories } from '../../Dashboard/shared/utils/dashboardActions';
import { checkerCreateDashboard } from '../utils/validation';
import { useDataSourcesList } from '@components/DashboardsWorkspace/hooks/useDataSources';

export const useCreateDashboard = ({ setIsCreateModal, handleAddDashboard, user, onDashboardCreated }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { appId: application_id } = useAppId();

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [formError, setFormError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [folderPermissions, setFolderPermissions] = useState(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);

    // Obtener fuentes de datos desde la API
    const { data: dataSourcesData, isLoading: isLoadingDataSources, isError: isErrorDataSources, isEmpty: isEmptyDataSources } = useDataSourcesList();
    
    // Formatear fuentes de datos para el select
    const dataSourcesList = useMemo(() => {
        return getDataSourcesList(dataSourcesData);
    }, [dataSourcesData]);

    // Generar campos del formulario con las fuentes de datos
    const baseFormFields = useMemo(() => {
        return getBaseFormFields(dataSourcesList);
    }, [dataSourcesList]);

    const dynamicFormConfig = useMemo(() => ({
        state: {
            fields: baseFormFields,
            groupConfig: groupConfig,
            isLoadingSelects: isLoadingDataSources,
            isExtended: true
        },
        show: { form: true },
    }), [baseFormFields, isLoadingDataSources]);

    const dynamicFormState = useDynamicFormControls(dynamicFormConfig);

    // --- Efectos ---
    useEffect(() => {
        fetchFolderPermissions();
    }, []);

    // --- Funciones de Lógica ---
    const fetchFolderPermissions = async () => {
        // Don't show notification in viewer mode (when there's an id in the URL)
        const isViewerMode = !!router.query?.id;
        if (isViewerMode) {
            return;
        }

        const folderId = sessionStorage.getItem('folderId');
        if (!folderId) {
            dispatch(pushNotification({ msg: "No se pudo obtener el ID de la carpeta.", status: "err" }));
            return;
        }

        try {
            setIsLoadingData(true);
            const response = await getAclById(folderId, {
                'Authorization': `Bearer ${user.userID}`
            });
            const aclData = response.data || response;
            if (response && response.status !== "error") {
                setFolderPermissions(aclData);
            }
        } catch (error) {
            dispatch(pushNotification({ msg: "Error al obtener permisos.", status: "err" }));
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleDataChange = (data) => {
        const fieldId = data?.fieldId;
        if (fieldId && validationErrors[fieldId]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
        if (formError && fieldId) setFormError("");
    };

    const handleCreateDashboard = async () => {
        const formData = dynamicFormState.actions.getFormData();
        setValidationErrors({});
        setFormError("");
        setIsLoadingData(true);

        // Validaciones previas
        if (!application_id || !folderPermissions) {
            const msg = !application_id ? "Falta ID de aplicación." : "Faltan permisos de carpeta.";
            dispatch(pushNotification({ msg, status: "err" }));
            setIsLoadingData(false);
            return;
        }

        // Get role IDs from folder permissions: try view_role/edit_role first, then view_permission?.rol?.id
        const viewRoleId = folderPermissions?.view_role?.id;
        const editRoleId = folderPermissions?.edit_role?.id;

        if (!viewRoleId || !editRoleId) {
            dispatch(pushNotification({
                msg: "No se pudieron obtener los roles de la carpeta. Asegúrese de que la carpeta tenga permisos configurados.",
                status: "err"
            }));
            setIsLoadingData(false);
            return;
        }

        const groupId = sessionStorage.getItem('groupId');
        if (!groupId) {
            dispatch(pushNotification({
                msg: "No se pudo obtener el ID del grupo.",
                status: "err"
            }));
            setIsLoadingData(false);
            return;
        }

        // Build payload according to CreateACLObject schema
        // Note: The endpoint also requires view_permission_id and edit_permission_id for compatibility
        const requestBody = {
            type: "dashboard", // Required by CreateACLObject
            name: formData.name || "", // Required by CreateACLObject (min=1, max=255)
            description: formData.description || "", // Optional, default=""
            group_id: groupId, // Required by CreateACLObject
            view_role_id: viewRoleId, // Required by CreateACLObject
            edit_role_id: editRoleId, // Required by CreateACLObject
            view_permission_id: viewRoleId, // Required by endpoint (same as view_role_id)
            edit_permission_id: editRoleId, // Required by endpoint (same as edit_role_id)
            application_id: application_id, // Required by CreateACLObject
            url: "", // Required by CreateACLObject, default=""
            url_builder: "own", // Required by CreateACLObject, default="own"
            url_image: "", // Required by CreateACLObject, default=""
            is_product: false, // Required by CreateACLObject, default=False
            propagate_auth: false, // Required by CreateACLObject, default=False
            folder_id: sessionStorage.getItem('folderId'), // Optional
            project_id: sessionStorage.getItem('projectId'), // Optional
            // Additional dashboard-specific fields
            data_sources: Array.isArray(formData.data_sources) ? formData.data_sources : [formData.data_sources].filter(Boolean),
            instances: ['123e4567-e89b-12d3-a456-426614174001'] // TODO: Remove this once the instances are implemented
        };

        const validation = checkerCreateDashboard(requestBody);

        if (validation.status) {
            try {
                const [response, data] = await handleCreateItemEntityWithResponse(
                    dispatch, user?.userID, "dashboard", "tablero", requestBody, false
                );

                if (response) {
                    let dashboardData = data;
                    if (selectedCategories.length > 0) {
                        try {
                            const categoryUpdate = await handleUpdateDashboardCategories(
                                data.id,
                                buildCategoryPayload(selectedCategories),
                                user?.userID
                            );
                            if (categoryUpdate?.categories?.length > 0) {
                                dashboardData = { ...data, categories: categoryUpdate.categories };
                            }
                        } catch (error) {
                            dispatch(pushNotification({
                                msg: error?.message || "No se pudieron guardar las etiquetas del tablero.",
                                status: "warn",
                            }));
                        }
                    }
                    if (setIsCreateModal) setIsCreateModal(false);
                    if (handleAddDashboard) {
                        handleAddDashboard(dashboardData);
                        sessionStorage.setItem('resourceId', data.id);
                    }
                    onDashboardCreated?.();
                    dynamicFormState.actions.resetForm();
                    setSelectedCategories([]);
                } else {
                    setFormError(data?.msg?.includes("already exists")
                        ? "El nombre del tablero ya existe."
                        : "Error al crear el tablero.");
                }
            } catch (error) {
                dispatch(pushNotification({ msg: "Error de servidor", status: "err" }));
            } finally {
                setIsLoadingData(false);
            }
        } else {
            setIsLoadingData(false);
            setFormError(validation.message);
        }
    };

    const handleClose = async () => {
        setIsRedirecting(true);
        dynamicFormState.actions.resetForm();
        setSelectedCategories([]);
        ['resourceId', 'resourceType', 'resourceName'].forEach(item => sessionStorage.removeItem(item));

        await new Promise(resolve => setTimeout(resolve, 500));
        await router.push(`/projects/folders/resources`);

        setIsCreateModal(false);
        setIsRedirecting(false);
    };

    // Retornamos todo lo que la View necesita
    return {
        states: {
            isLoadingData,
            formError,
            validationErrors,
            isRedirecting,
            dynamicFormState,
            isLoadingDataSources,
            isErrorDataSources,
            isEmptyDataSources,
            baseFormFields,
            selectedCategories,
            userToken: user?.userID,
        },
        actions: {
            handleCreateDashboard,
            handleDataChange,
            handleClose,
            handleFieldChange: dynamicFormState.actions.handleFieldChange,
            handleCategoriesChange: setSelectedCategories,
        }
    };
};
import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from 'next/router';
import { useQueryClient } from "@tanstack/react-query";
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

export const useCreateDashboard = ({
    setIsCreateModal,
    handleAddDashboard,
    user,
    onDashboardCreated,
    originDashboard,
    initialCategories = [],
    open = false
}) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { appId: application_id } = useAppId();

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [formError, setFormError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [folderPermissions, setFolderPermissions] = useState(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState(initialCategories);

    // Save reference to previous 'open' state to reset selectedCategories when modal opens
    const prevOpenRef = useRef(open);

    useEffect(() => {
        if (open && !prevOpenRef.current) {
            setSelectedCategories(Array.isArray(initialCategories) ? initialCategories : []);
        }
        prevOpenRef.current = open;
    }, [open, initialCategories]);

    // Get data sources for the select field in the form
    const { data: dataSourcesData, isLoading: isLoadingDataSources, isError: isErrorDataSources, isEmpty: isEmptyDataSources } = useDataSourcesList();

    // Format data sources for the select
    const dataSourcesList = useMemo(() => {
        return getDataSourcesList(dataSourcesData);
    }, [dataSourcesData]);

    // Generate form fields with data sources
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

    // --- Effects ---
    useEffect(() => {
        if (open) {
            fetchFolderPermissions();
        }
    }, [open]);

    // --- Logic Functions ---
    const fetchFolderPermissions = async () => {
        const isViewerMode = !!router.query?.id;
        if (isViewerMode) return;
            
        // HIerarchy fallback: originDashboard -> sessionStorage
        const folderId = originDashboard?.folder_id || sessionStorage.getItem('folderId');
        if (!folderId) {
            dispatch(pushNotification({ msg: "No se pudo obtener el ID de la carpeta.", status: "err" }));
            return;
        }

        // Sync sessionStorage with dashboard data if available
        if (originDashboard?.folder_id) sessionStorage.setItem('folderId', originDashboard.folder_id);
        if (originDashboard?.project_id) sessionStorage.setItem('projectId', originDashboard.project_id);
        if (originDashboard?.group_id) sessionStorage.setItem('groupId', originDashboard.group_id);
        try {
            setIsLoadingData(true);
            const response = await getAclById(folderId, { 'Authorization': `Bearer ${user?.userID}` });
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

    const formattedCategories = (selectedCategories || [])
        .map((cat) => (typeof cat === "object" ? cat.name || cat.value || "" : cat))
        .filter(Boolean);

    const folderId = originDashboard?.folder_id || sessionStorage.getItem('folderId');
    const projectId = originDashboard?.project_id || sessionStorage.getItem('projectId');
    const groupId = originDashboard?.group_id || sessionStorage.getItem('groupId');

    if (!application_id) {
        dispatch(pushNotification({ msg: "Falta ID de aplicación.", status: "err" }));
        setIsLoadingData(false);
        return;
    }

    if (!groupId) {
        dispatch(pushNotification({ msg: "No se pudo obtener el ID del grupo.", status: "err" }));
        setIsLoadingData(false);
        return;
    }

    // Extracción robusta de roles con respaldo en folderPermissions y originDashboard
    const viewRoleId = 
        folderPermissions?.view_role?.id || 
        folderPermissions?.view_role_id || 
        originDashboard?.view_role?.id || 
        originDashboard?.view_role_id;

    const editRoleId = 
        folderPermissions?.edit_role?.id || 
        folderPermissions?.edit_role_id || 
        originDashboard?.edit_role?.id || 
        originDashboard?.edit_role_id;

    if (!viewRoleId || !editRoleId) {
        dispatch(pushNotification({ 
        msg: "No se pudieron obtener los roles de la carpeta. Asegúrese de que la carpeta tenga permisos configurados.", 
        status: "err" 
        }));
        setIsLoadingData(false);
        return;
    }

    const requestBody = {
        type: "dashboard",
        name: formData.name || "",
        description: formData.description || "",
        group_id: groupId,
        view_role_id: viewRoleId,
        edit_role_id: editRoleId,
        view_permission_id: viewRoleId,
        edit_permission_id: editRoleId,
        application_id: application_id,
        url: "",
        url_builder: "own",
        url_image: "",
        is_product: false,
        propagate_auth: false,
        folder_id: folderId || "",
        project_id: projectId || null,
        data_sources: Array.isArray(formData.data_sources) ? formData.data_sources : [formData.data_sources].filter(Boolean),
        instances: ['123e4567-e89b-12d3-a456-426614174001']
    };

    const validation = checkerCreateDashboard({
        ...requestBody,
        categories: formattedCategories,
    });

    if (validation.status) {
        try {
        const [response, data] = await handleCreateItemEntityWithResponse(
            dispatch,
            user?.userID,
            "dashboard",
            "tablero",
            requestBody,
            false
        );

        if (response) {
            let dashboardData = data;
            if (formattedCategories.length > 0 && data?.id) {
            try {
                const categoryUpdate = await handleUpdateDashboardCategories(
                data.id,
                buildCategoryPayload(formattedCategories),
                user?.userID
                );
                if (categoryUpdate?.categories?.length > 0) {
                dashboardData = { ...data, categories: categoryUpdate.categories };
                }
            } catch (error) {
                dispatch(pushNotification({ 
                msg: error?.message || "No se pudieron guardar las etiquetas del tablero.", 
                status: "warn" 
                }));
            }
            }

            await queryClient.invalidateQueries();
            if (setIsCreateModal) setIsCreateModal(false);
            if (handleAddDashboard) {
            handleAddDashboard(dashboardData);
            sessionStorage.setItem('resourceId', data.id);
            }
            onDashboardCreated?.(dashboardData);
            dynamicFormState.actions.resetForm();
            setSelectedCategories([]);
        } else {
            setFormError(data?.msg?.includes("already exists") ? "El nombre del tablero ya existe." : "Error al crear el tablero.");
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
        dynamicFormState.actions.resetForm();
        setSelectedCategories([]);
        if (typeof setIsCreateModal === "function") {
            setIsCreateModal(false);
        } else {
            setIsRedirecting(true);
            ['resourceId', 'resourceType', 'resourceName'].forEach(item => sessionStorage.removeItem(item));
            await new Promise(resolve => setTimeout(resolve, 300));
            await router.push(`/projects/folders/resources`);
            setIsRedirecting(false);
        }
    };

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
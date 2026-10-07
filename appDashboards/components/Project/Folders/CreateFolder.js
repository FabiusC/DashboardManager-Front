import React, { useMemo, useEffect, useState } from 'react';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Divider,
    Alert,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { StyledButton } from '../../Recursive/mui_styled_components';
import { LoadingAssembly } from '@creangel/ifindit-ui';
import { pushNotification } from '../../../redux/actions';
import { useAppId } from '../../../hooks/useAppId';
import _ from 'lodash';
import { useDynamicFormControls } from '@creangel/ifindit-ui/hooks';
import { DynamicForm } from '@creangel/ifindit-ui';
import { Person, Business } from '@mui/icons-material';
import { createFolder as createFolderService } from './services/Folder';
import { getAclById } from '@services/creangelAuthAPI';


const CreateFolder = ({
    handleFolder,
    user,
    setIsCreateModal,
    projectId,
    ...props
}) => {

    const [formError, setFormError] = useState("");
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [projectPermissions, setProjectPermissions] = useState(null);
    const [permissionsWarning, setPermissionsWarning] = useState("");

    const dispatch = useDispatch();
    const { appId: application_id } = useAppId();
    const baseFormFields = useMemo(() => [
        {
            id: "name",
            component: "input",
            value: "",
            title: "Nombre de la carpeta",
            info: "Ingresar el nombre de la carpeta",
            placeholder: "",
            type: "text",
            category: "Folder"
        },
        {
            id: "description",
            component: "input",
            value: "",
            title: "Descripción",
            info: "Descripción de la carpeta",
            placeholder: "",
            type: "text",
            category: "Folder"
        },
        {
            id: "color",
            component: "color",
            value: "#ffce3c",
            title: "Color",
            info: "Color del ícono de la carpeta",
            placeholder: "",
            type: "text",
            category: "Folder"
        },
        {
            id: "tags",
            component: "multipleOptions",
            title: "Etiquetas",
            category: "Folder",
            info: "Palabras clave sobre las cuales pueden realizar una búsqueda",
            placeholder: 'Ej: Carpeta 1, Carpeta 2...',
            value: [],
            showValues: [],
            valueId: "",
            maxTags: 5,
        },
    ], []);

    const groupConfig = useMemo(() => ({
        order: ['Folder'],
        labels: {
            Folder: 'Carpeta'
        },
        icons: {
            Folder: <Person sx={{ fontSize: '20px', color: 'primary.main' }} />
        }
    }), []);
    const handleDataChange = (data) => {
        const fieldId = data?.fieldId;
        if (fieldId && validationErrors[fieldId]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }

        if (formError && fieldId) {
            setFormError("");
        }
    };

    const dynamicFormState = useDynamicFormControls({
        state: {
            fields: baseFormFields,
            groupConfig: groupConfig,
            isLoadingSelects: false,
            isExtended: true
        },
        show: {
            form: true
        },
        handlers: {
            onDataChange: handleDataChange
        }
    });

    const createFolder = async () => {
        const formData = dynamicFormState.actions.getFormData();

        if (!application_id) {
            dispatch(pushNotification({
                msg: "No se pudo obtener el ID de la aplicación. Contacte con su proveedor.",
                status: "err"
            }));
            return;
        }

        if (!projectPermissions) {
            dispatch(pushNotification({
                msg: "No se pudieron obtener los permisos del proyecto.",
                status: "err"
            }));
            return;
        }

        const groupId = sessionStorage.getItem('groupId');
        if (!groupId) {
            dispatch(pushNotification({
                msg: "No se pudo obtener el ID del grupo.",
                status: "err"
            }));
            return;
        }

        // Build payload with fields accepted by the endpoint (using view_role_id and edit_role_id)
        // Get role IDs from project permissions: try view_role/edit_role first, then view_permission?.rol?.id
        const viewRoleId = projectPermissions?.view_role?.id || projectPermissions?.view_permission?.rol?.id;
        const editRoleId = projectPermissions?.edit_role?.id || projectPermissions?.edit_permission?.rol?.id;

        if (!viewRoleId || !editRoleId) {
            dispatch(pushNotification({
                msg: "No se pudieron obtener los roles del proyecto. Asegúrese de que el proyecto tenga permisos configurados.",
                status: "err"
            }));
            setIsLoadingData(false);
            return;
        }

        const folderPayload = {
            name: formData.name || "",
            description: formData.description || "",
            color: formData.color,
            group_id: groupId,
            view_role_id: viewRoleId,
            edit_role_id: editRoleId,
            application_id: application_id,
            project_id: projectId,
            tags: Array.isArray(formData.tags) ? formData.tags : (formData.tags ? formData.tags.split(',').filter(t => t.trim()) : [])
        };

        const params = {
            formData: folderPayload,
            userToken: user.userID
        };

        const stateSetters = {
            setIsLoadingData,
            setFormError,
            setValidationErrors
        };

        const callbacks = {
            handleFolder: handleFolder,
            setIsCreateModal: setIsCreateModal,
            handleCleanForm: () => {
                dynamicFormState.actions.resetForm();
            },
            dispatch,
            pushNotification
        };

        await createFolderService(params, stateSetters, callbacks);
    };



    const handleFetchProjectPermissions = async () => {
        try {
            setIsLoadingData(true);
            const response = await getAclById(projectId, {
                'Authorization': `Bearer ${user.userID}`
            });


            if (response.status === "success" && response.data) {
                const aclData = response.data;

                if (aclData) {
                    setProjectPermissions(aclData);

                    // Verificar si los roles están disponibles
                    const viewRoleId = aclData?.view_role?.id || aclData?.view_permission?.rol?.id;
                    const editRoleId = aclData?.edit_role?.id || aclData?.edit_permission?.rol?.id;

                    if (!viewRoleId || !editRoleId) {
                        setPermissionsWarning("No se pudieron obtener los roles del proyecto. Asegúrese de que el proyecto tenga permisos configurados.");
                        dispatch(pushNotification({
                            msg: "No se pudieron obtener los roles del proyecto. Asegúrese de que el proyecto tenga permisos configurados.",
                            status: "err"
                        }));
                    } else {
                        setPermissionsWarning(""); // Limpiar advertencia si los roles están disponibles
                    }
                } else {
                    console.error("No se pudieron extraer los datos del ACL");
                    setPermissionsWarning("No se pudieron obtener los permisos del proyecto.");
                    dispatch(pushNotification({
                        msg: "No se pudieron obtener los permisos del proyecto.",
                        status: "err"
                    }));
                }
            } else {
                setPermissionsWarning("No se pudieron obtener los permisos del proyecto.");
                dispatch(pushNotification({
                    msg: response?.msg || "No se pudieron obtener los permisos del proyecto.",
                    status: "err"
                }));
            }
        } catch (error) {
            console.error('Error al obtener permisos del proyecto:', error);
            dispatch(pushNotification({
                msg: "Error al obtener los permisos del proyecto.",
                status: "err"
            }));
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            handleFetchProjectPermissions();
        }
    }, [projectId]);

    return (
        <Box className="pad_35">
            <DialogTitle variant="h6" noWrap component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                Crear carpeta nueva
            </DialogTitle>
            <Divider />
            {
                isLoadingData &&
                <LoadingAssembly state={{ message: "Creando carpeta...", borderRadius: false, boxShadow: false, size: 60 }} />
            }
            {!isLoadingData && (
                <Box>
                    <DialogContent sx={{ "& .MuiBox-root": { boxSizing: "border-box" } }}>
                        <DynamicForm
                            state={dynamicFormState.state}
                            show={dynamicFormState.show}
                            handlers={{
                                onDataChange: handleDataChange,
                                handleFieldChange: dynamicFormState.actions.handleFieldChange
                            }}
                            sx={{
                                '& .MuiBox-root[style*="grid-template-columns"]': {
                                    gridTemplateColumns: '1fr !important'
                                }
                            }}
                        />

                        {/* Mostrar errores de validación específicos */}
                        {Object.keys(validationErrors).length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                {Object.entries(validationErrors).map(([fieldId, errorMessage]) => (
                                    <Alert
                                        key={fieldId}
                                        severity="error"
                                        sx={{
                                            mb: 1,
                                            "& .MuiAlert-message": {
                                                fontWeight: 500,
                                            },
                                        }}
                                    >
                                        <strong>{baseFormFields.find(field => field.id === fieldId)?.title}:</strong> {errorMessage}
                                    </Alert>
                                ))}
                            </Box>
                        )}

                    </DialogContent>

                    {/* Mostrar advertencia sobre permisos del proyecto */}
                    {permissionsWarning && (
                        <Box sx={{ px: 3, pb: 2 }}>
                            <Alert
                                severity="warning"
                                sx={{
                                    "& .MuiAlert-message": {
                                        fontWeight: 500,
                                    },
                                }}
                            >
                                {permissionsWarning}
                            </Alert>
                        </Box>
                    )}

                    {formError && (
                        <Box sx={{ px: 3, pb: 2 }}>
                            <Alert
                                severity="error"
                                sx={{
                                    "& .MuiAlert-message": {
                                        fontWeight: 500,
                                    },
                                }}
                            >
                                {formError}
                            </Alert>
                        </Box>
                    )}

                    <DialogActions>
                        <StyledButton onMouseDown={() => setIsCreateModal(false)}>Cancelar</StyledButton>
                        <StyledButton
                            onClick={() => createFolder()}
                            variant="contained"
                            disabled={isLoadingData || !!permissionsWarning}>
                            {isLoadingData ? 'Creando...' : 'Crear Carpeta'}
                        </StyledButton>
                    </DialogActions>
                </Box>
            )}
        </Box>
    );
};

export default CreateFolder;
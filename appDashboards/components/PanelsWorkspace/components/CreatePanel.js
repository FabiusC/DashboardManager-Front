import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    Grid,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    Typography,
    Tooltip,
    TableBody,
    IconButton,
    Alert,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Divider
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { useAppId } from '../../../hooks/useAppId';
import { handleCreateItemEntityWithResponse } from '../../../helpers/dashboardAPI/genericRequest';
import { StyledButton } from '../../Recursive/mui_styled_components';
import { LoadingAssembly } from '@creangel/ifindit-ui';
import { AddCircle, InfoOutlined, RemoveCircle, Storage, Inbox } from '@mui/icons-material';
import { connect } from 'react-redux';
import useTabs from "../hooks/useTabsContext";
import RedirectingLoader from '../../Recursive/Loaders/RedirectLoaders';
import { pushNotification } from "../../../redux/actions";
import router from 'next/router';
import { getAclById } from '@services/creangelAuthAPI';
import { DynamicForm } from "@creangel/ifindit-ui";
import { useDynamicFormControls } from "@creangel/ifindit-ui/hooks";
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import { useDataSourcesList } from '../../DashboardsWorkspace/hooks/useDataSources';

const CreatePanel = (props) => {
    const { changeSideTabState } = useTabs();
    const [error, setError] = useState('');
    const [formError, setFormError] = useState("")
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [folderPermissions, setFolderPermissions] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const { appId: application_id } = useAppId();
    const dispatch = useDispatch();

    // Obtener fuentes de datos desde la API y formatear para el select
    const { data: dataSourcesData, isLoading: isLoadingDataSources, isError: isErrorDataSources, error: errorDataSources, isEmpty: isEmptyDataSources } = useDataSourcesList();
    const dataSourcesList = React.useMemo(() => {
        if (!dataSourcesData || dataSourcesData.length === 0) return [];
        return dataSourcesData.map((source) => ({
            id: source.id,
            showed_name: source.alias,
            value: source.id
        }));
    }, [dataSourcesData]);

    const baseFormFields = React.useMemo(() => [
        {
            id: "title",
            component: "input",
            value: "",
            title: "Título del panel",
            info: "Ingresar el título del panel",
            placeholder: "",
            type: "text",
            category: "panel"
        },
        {
            id: "description",
            component: "textarea",
            value: "",
            title: "Descripción",
            info: "Descripción del panel",
            placeholder: "",
            // type: "text",
            category: "panel",
            rows: 2,
            maxLength: 300,
            showCharCount: true
        },
        {
            id: "datasource_id",
            component: "select",
            value: "",
            title: "Fuente de datos",
            info: "Fuente de datos del panel",
            placeholder: "",
            type: "text",
            category: "configuration",
            showValues: dataSourcesList || []
        }
    ], [dataSourcesList]);

    const formFields = baseFormFields;

    const groupConfig = React.useMemo(() => ({
        order: ['panel', 'configuration'],
        labels: {
            panel: 'Información del Panel',
            configuration: 'Configuración'
        },
        icons: {
            panel: <DashboardIcon sx={{ fontSize: '20px', color: 'primary.main' }} />,
            configuration: <SettingsIcon sx={{ fontSize: '20px', color: 'primary.main' }} />
        }
    }), []);

    const dynamicFormState = useDynamicFormControls({
        state: {
            fields: formFields,
            groupConfig: groupConfig,
            isLoadingSelects: false,
            isExtended: true
        },
        show: {
            form: true
        },
    });

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

    const handleClose = async () => {
        setIsRedirecting(true);

        sessionStorage.removeItem('resourceId');
        sessionStorage.removeItem('resourceType');
        sessionStorage.removeItem('resourceName');

        await new Promise(resolve => setTimeout(resolve, 500));

        await router.push(`/projects/folders/resources`);

        props.setIsCreateModal(false);
        setIsRedirecting(false);
    };

    const handleCreatePanel = async () => {
        const formData = dynamicFormState.actions.getFormData();

        setValidationErrors({});
        setFormError("");
        setIsLoadingData(true);

        if (!application_id) {
            dispatch(pushNotification({
                msg: "No se pudo obtener el ID de la aplicación. Contacte con su proveedor.",
                status: "err"
            }));
            setIsLoadingData(false);
            return;
        }

        if (!folderPermissions) {
            dispatch(pushNotification({
                msg: "No se pudieron obtener los permisos de la carpeta.",
                status: "err"
            }));
            setIsLoadingData(false);
            return;
        }

        // Get role IDs from folder permissions: try view_role/edit_role first, then view_permission?.rol?.id
        const viewRoleId = folderPermissions?.view_role?.id || folderPermissions?.view_permission?.rol?.id;
        const editRoleId = folderPermissions?.edit_role?.id || folderPermissions?.edit_permission?.rol?.id;

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
            type: "panel", // Required by CreateACLObject
            name: formData.title || "", // Required by CreateACLObject (min=1, max=255)
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
            // Additional panel-specific fields
            title: formData.title || "",
            favorite: false,
            tags: [],
            expanded: true,
            width: 3,
            height: 12,
            resizable: false,
            datasource_id: formData.datasource_id || "",
            group_by: [],
            selected_fields: [],
            limit: 12,
            is_public: formData.is_public || false,
            is_published: formData.is_published || true,
            colors: props.organization[0].palette
        }

        // Validar directamente sin depender del estado actualizado
        const validationResult = validatePanelData(requestBody)

        if (validationResult.isValid) {
            const [response, data] = await handleCreateItemEntityWithResponse(
                dispatch,
                props.user.userID,
                "panel",
                "panel",
                requestBody,
                false
            )
            if (response) {
                setIsLoadingData(false);
                sessionStorage.setItem('resourceId', data.id);
                // Activar el tab de datos después de crear el panel
                changeSideTabState('data', 'isDisabled', false);
                changeSideTabState('data', 'isActive', true);
                //dispatch(pushNotification({ msg: "Panel creado exitosamente", status: "ok" }));

                // Limpiar formulario
                dynamicFormState.actions.resetForm();
                window.location.reload();
                props.setIsCreateModal(false)
            } else {
                setIsLoadingData(false)
                if (data?.msg?.includes("already exists")) {
                    setFormError("El nombre del panel ya existe en la organización. El panel con el nombre ingresado puede estar activo o en la papelera.")
                } else {
                    setFormError("Error al crear el panel. Inténtalo de nuevo.")
                }
            }
        } else {
            // Actualizar el estado con los errores
            setIsLoadingData(false)
        }
    }

    // Nueva función de validación que no depende del estado
    const validatePanelData = (panelData) => {
        let isValid = true

        // Validar título
        if (!panelData.title || panelData.title.trim() === "") {
            setValidationErrors(prev => ({ ...prev, title: "El nombre del panel no puede estar vacío." }));
            isValid = false
        } else if (panelData.title.length < 3) {
            setValidationErrors(prev => ({ ...prev, title: "El nombre del panel debe contener al menos 3 caracteres." }));
            isValid = false
        } else if (panelData.title.length > 500) {
            setValidationErrors(prev => ({ ...prev, title: "El nombre del panel no puede contener más de 500 caracteres." }));
            isValid = false
        }

        // Validar descripción
        const threeWords = panelData.description.trim().split(/\s+/).length >= 3
        if (!panelData.description || panelData.description.trim() === "") {
            setValidationErrors(prev => ({ ...prev, description: "La descripción del panel no puede estar vacía." }));
            isValid = false
        } else if (!threeWords) {
            setValidationErrors(prev => ({ ...prev, description: "La descripción del panel debe contener al menos 3 palabras." }));
            isValid = false
        } else if (panelData.description.length > 10000) {
            setValidationErrors(prev => ({ ...prev, description: "La descripción del panel no puede contener más de 10000 caracteres." }));
            isValid = false
        }

        // Validar fuente de datos
        if (!panelData.datasource_id || panelData.datasource_id.trim() === "") {
            setValidationErrors(prev => ({ ...prev, datasource_id: "La fuente de datos del panel no puede estar vacía." }));
            isValid = false
        }

        return { isValid }
    }

    // Función para obtener permisos de la carpeta padre
    const handleFetchFolderPermissions = async () => {
        const folderId = sessionStorage.getItem('folderId');
        if (!folderId) {
            dispatch(pushNotification({
                msg: "No se pudo obtener el ID de la carpeta.",
                status: "err"
            }));
            return;
        }

        try {
            setIsLoadingData(true);
            const response = await getAclById(folderId, {
                'Authorization': `Bearer ${props.user.userID}`
            });

            if (response && response.status !== "error" && response.status !== "err") {
                // Los datos del ACL pueden venir en response.data o directamente en response
                const aclData = response.data || response;
                setFolderPermissions(aclData);
            } else {
                dispatch(pushNotification({
                    msg: response?.msg || "No se pudieron obtener los permisos de la carpeta.",
                    status: "err"
                }));
            }
        } catch (error) {
            console.error('Error al obtener permisos de la carpeta:', error);
            dispatch(pushNotification({
                msg: "Error al obtener los permisos de la carpeta.",
                status: "err"
            }));
        } finally {
            setIsLoadingData(false);
        }
    };

    // Cargar permisos al montar el componente
    React.useEffect(() => {
        handleFetchFolderPermissions();
    }, []);

    return (
        <Box className="pad_35">
            {isRedirecting ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <RedirectingLoader />
                </Box>
            ) : (
                <>
                    {/* Mostrar mensaje cuando no hay fuentes disponibles - Sin formulario */}
                    {!isLoadingDataSources && !isErrorDataSources && isEmptyDataSources ? (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            minHeight: '400px',
                            py: 6,
                            px: 4
                        }}>
                            <Storage 
                                sx={{ 
                                    fontSize: 80, 
                                    color: 'text.secondary',
                                    mb: 3,
                                    opacity: 0.6
                                }} 
                            />
                            <Typography 
                                variant="h5" 
                                sx={{ 
                                    fontWeight: 500,
                                    mb: 2,
                                    textAlign: 'center',
                                    color: 'text.primary'
                                }}
                            >
                                No hay fuentes de datos disponibles
                            </Typography>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                    maxWidth: '500px',
                                    mb: 4
                                }}
                            >
                                No se encontraron fuentes de datos en el sistema. Para crear un panel, primero debe configurar al menos una fuente de datos.
                                <br />
                                <br />
                                Por favor, configure una fuente de datos.
                            </Typography>
                            <StyledButton onMouseDown={handleClose} variant="outlined">
                                Cerrar
                            </StyledButton>
                        </Box>
                    ) : (
                        <>
                            <DialogTitle variant="h6" noWrap component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                                Crear nuevo panel
                            </DialogTitle>
                            <Divider />

                            {isLoadingData ? (
                                <LoadingAssembly state={{ message: "Creando panel...", borderRadius: false, boxShadow: false, size: 60 }} />
                            ) : (
                                <Box>
                                    <DialogContent sx={{ "& .MuiBox-root": { boxSizing: "border-box" } }}>
                                        {/* Mostrar error al cargar fuentes de datos */}
                                        {isErrorDataSources && (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                py: 4
                                            }}>
                                                <Inbox 
                                                    sx={{ 
                                                        fontSize: 60, 
                                                        color: 'error.main',
                                                        mb: 2,
                                                        opacity: 0.7
                                                    }} 
                                                />
                                                <Typography 
                                                    variant="h6" 
                                                    sx={{ 
                                                        fontWeight: 500,
                                                        mb: 1,
                                                        textAlign: 'center',
                                                        color: 'error.main'
                                                    }}
                                                >
                                                    Error al cargar fuentes de datos
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        textAlign: 'center',
                                                        color: 'text.secondary',
                                                        maxWidth: '400px'
                                                    }}
                                                >
                                                    {errorDataSources || "No se pudieron cargar las fuentes de datos. Por favor, intente nuevamente."}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Mostrar loading mientras cargan las fuentes */}
                                        {isLoadingDataSources && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                                <LoadingAssembly state={{ message: "Cargando fuentes de datos...", borderRadius: false, boxShadow: false, size: 40 }} />
                                            </Box>
                                        )}

                                        {!isLoadingDataSources && !isErrorDataSources && (
                                            <>
                                                <DynamicForm
                                                    state={dynamicFormState.state}
                                                    show={dynamicFormState.show}
                                                    handlers={{
                                                        onDataChange: handleDataChange,
                                                        handleFieldChange: dynamicFormState.actions.handleFieldChange
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
                                                                <strong>{formFields.find(field => field.id === fieldId)?.title}:</strong> {errorMessage}
                                                            </Alert>
                                                        ))}
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </DialogContent>

                                    {/* Error general del formulario */}
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
                                        <StyledButton onMouseDown={handleClose} disabled={isLoadingData}>
                                            Cancelar
                                        </StyledButton>
                                        <StyledButton 
                                            onClick={() => handleCreatePanel()} 
                                            variant="contained" 
                                            disabled={isLoadingData || isLoadingDataSources || isEmptyDataSources || isErrorDataSources}
                                        >
                                            {isLoadingData ? "Creando..." : "Guardar"}
                                        </StyledButton>
                                    </DialogActions>
                                </Box>
                            )}
                        </>
                    )}
                </>
            )}
        </Box>
    );
};

const mapStateToProps = (state) => ({
    organization: state.organization,
});

export default connect(mapStateToProps)(CreatePanel);
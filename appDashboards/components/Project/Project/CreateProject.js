import _ from "lodash";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
    Box,
    Divider,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import { pushNotification } from "@redux/actions";
import { StyledButton } from "@components/Recursive/mui_styled_components";
import { LoadingAssembly } from "@creangel/ifindit-ui";
import { useDispatch } from "react-redux";
import { createProject as createProjectService, validateProjectData } from './services/Project';
import { fetchGroups as fetchGroupsService } from './services/Groups';
import { getUserRol } from '@services/creangelAuthAPI';
import { validatorAPIBasicParameters } from "@source/validators";
import { DynamicForm } from "@creangel/ifindit-ui";
import { useDynamicFormControls } from "@creangel/ifindit-ui/hooks";
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import useAppId from "hooks/useAppId";

const CreateProject = (props) => {
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [tags, setTags] = useState([]);
    const [formError, setFormError] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupsList, setGroupsList] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    // Conexión al estado de Redux
    const { appId: application_id } = useAppId();
    
    // Referencia para el estado del formulario dinámico
    const dynamicFormStateRef = useRef(null);

    const baseFormFields = useMemo(() => [
        {
            id: "name",
            component: "input",
            value: "",
            title: "Nombre del proyecto",
            info: "Ingresar el nombre del proyecto",
            placeholder: "" ,
            type: "text",
            category: "project"
        },
        {
            id: "description",
            component: "input",
            value: "",
            title: "Descripción",
            info: "Descripción del proyecto",
            placeholder: "",
            type: "text",
            category: "project"
        },
        {
            id: "color",
            component: "color",
            value: "#ffce3c",
            title: "Color",
            info: "Color del ícono del proyecto",
            placeholder: "",
            type: "text",
            category: "project"
        },
        {
            id: "group_id",
            component: "select",
            value: "",
            title: "Grupo",
            info: "Grupo en el que se creará el proyecto",
            placeholder: "",
            type: "text",
            category: "Authorization",
            showValues: groupsList || []
        },
        {
            id: "view_permission_id",
            component: "select",
            value: "",
            title: "Nivel de visualización",
            info: "Nivel de acceso para la visualización del proyecto",
            placeholder: "",
            type: "text",
            category: "Authorization",
            showValues: [],
            disabled: true,
            required: true
        },
        {
            id: "edit_permission_id",
            component: "select",
            value: "",
            title: "Nivel de edición y eliminado",
            info: "Nivel de acceso para la edición y eliminado del proyecto",
            placeholder: "",
            type: "text",
            category: "Authorization",
            showValues: [],
            disabled: true,
            required: true
        },
    ], [groupsList]);

    // Función para actualizar los campos de permisos dinámicamente
    const updatePermissionFields = useCallback(
        (
            viewOptions = [],
            editOptions = [],
            enabled = false
        ) => {
            const currentState = dynamicFormStateRef.current;
            // Intentar acceder a los campos desde diferentes posibles rutas
            const currentFields = currentState?.state?.form?.fields || currentState?.state?.fields;

            if (!currentFields?.length) return;

            const updatedFields = currentFields.map((field) => {
                if (field.id === 'view_permission_id') {
                    return { 
                        ...field, 
                        value: '', 
                        showValues: viewOptions, 
                        disabled: !enabled 
                    };
                }
                if (field.id === 'edit_permission_id') {
                    return { 
                        ...field, 
                        value: '', 
                        showValues: editOptions, 
                        disabled: !enabled 
                    };
                }
                return field;
            });

            currentState?.actions.updateFields(updatedFields);
        },
        []
    );

    const handleDataChange = useCallback(
        async (changedField, formData) => {
            // Compatibilidad: si solo se pasa un parámetro, tratarlo como el campo cambiado
            const data = changedField?.fieldId ? changedField : (changedField || {});
            const fieldId = data?.fieldId ?? data?.field?.id ?? data?.id;
            
            // Obtener formData del estado si no se proporciona como parámetro
            const currentFormData = formData || dynamicFormStateRef.current?.actions?.getFormData?.() || {};

            if (fieldId === 'group_id') {
                const groupValue = 
                    currentFormData?.group_id ?? 
                    data?.value ?? 
                    data?.field?.value ?? 
                    '';

                setSelectedGroup(groupValue || null);

                if (!groupValue) {
                    updatePermissionFields([], [], false);
                } else {
                    setIsLoadingRoles(true);
                    try {
                        const [viewResponse, editResponse] = await Promise.all([
                            getUserRol(
                                { group_id: groupValue, type_mode: 'view' },
                                { Authorization: `Bearer ${props.user.userID}` }
                            ),
                            getUserRol(
                                { group_id: groupValue, type_mode: 'edit' },
                                { Authorization: `Bearer ${props.user.userID}` }
                            )
                        ]);

                        const [validViewResponse, viewResponseContent] = validatorAPIBasicParameters(viewResponse);
                        const [validEditResponse, editResponseContent] = validatorAPIBasicParameters(editResponse);

                        const adaptOptions = (payload) => {
                            if (!payload || !Array.isArray(payload)) return [];
                            return payload.map(role => ({
                                id: role.id,
                                value: role.id,
                                label: role.type || role.description || '',
                                showed_name: role.type || role.description || ''
                            }));
                        };

                        const viewOptions = validViewResponse && 
                            viewResponseContent?.status === 'ok' && 
                            Array.isArray(viewResponseContent.data)
                            ? adaptOptions(viewResponseContent.data)
                            : [];

                        const editOptions = validEditResponse && 
                            editResponseContent?.status === 'ok' && 
                            Array.isArray(editResponseContent.data)
                            ? adaptOptions(editResponseContent.data)
                            : [];

                        updatePermissionFields(viewOptions, editOptions, true);
                    } catch (error) {
                        console.error('Error al obtener roles:', error);
                        setFormError('No se pudieron actualizar los roles para el grupo seleccionado');
                        updatePermissionFields([], [], false);
                    } finally {
                        setIsLoadingRoles(false);
        }
                }
            }

            // Limpiar errores de validación cuando el campo cambia
            if (fieldId) {
                setValidationErrors(prev => {
                    if (!prev[fieldId]) return prev;
                    const { [fieldId]: _removed, ...rest } = prev;
                    return rest;
                });
            }

            // Limpiar error general del formulario
            if (formError) {
                setFormError('');
        }
        },
        [formError, updatePermissionFields, props.user.userID]
    );
    const groupConfig = useMemo(() => ({
        order: ['project', 'Authorization'],
        labels: {
            project: 'Proyecto',
            Authorization: 'Información de Autorización'
        },
        icons: {
            project: <PersonIcon sx={{ fontSize: '20px', color: 'primary.main' }} />,
            Authorization: <BusinessIcon sx={{ fontSize: '20px', color: 'primary.main' }} />
        }
    }), []);
    const dynamicFormState = useDynamicFormControls({
        state: {
            fields: baseFormFields,
            groupConfig: groupConfig,
            isLoadingSelects: isLoadingRoles,
            isExtended: true
        },
        show: {
            form: true
        },
        handlers: {
            onDataChange: handleDataChange
        }

    });

    // Actualizar la referencia cuando cambia el estado del formulario
    dynamicFormStateRef.current = dynamicFormState;

    const dispatch = useDispatch();

    const handleCreateProject = async () => {
        const formData = dynamicFormState.actions.getFormData();
        console.log("formData", formData);

        setValidationErrors({});
        setFormError("");

        if (!application_id) {
            dispatch(pushNotification({
                msg: "No se pudo obtener el ID de la aplicación. Contacte con su proveedor.",
                status: "err"
            }));
            return;
        }

        // Build payload with fields accepted by the endpoint (using view_role_id and edit_role_id)
        const projectPayload = {
            name: formData.name || "",
            description: formData.description || "",
            color: formData.color,
            group_id: formData.group_id || selectedGroup,
            view_role_id: formData.view_permission_id,
            edit_role_id: formData.edit_permission_id,
            application_id: application_id,
            tags: tags || []
        };

        const params = {
            formData: projectPayload,
            tags,
            selectedGroup,
            userToken: props.user.userID
        };

        const stateSetters = {
            setIsLoadingData,
            setFormError,
            setValidationErrors
        };

        const callbacks = {
            handleProject: props.handleProject,
            setIsCreateModal: props.setIsCreateModal,
            handleCleanForm: () => {
                dynamicFormState.actions.resetForm();
            },
            dispatch,
            pushNotification
        };

        await createProjectService(params, stateSetters, callbacks);
    };

    useEffect(() => {
        handleFetchGroups();
    }, []);

    const handleFetchGroups = async () => {
        const params = {
            userToken: props.user.userID
            
        };

        const stateSetters = {
            setGroupsList
        };

        const callbacks = {
            dispatch,
            pushNotification
        };

        await fetchGroupsService(params, stateSetters, callbacks);

    };

    return (
        <Box className="pad_35">
            <DialogTitle variant="h6" noWrap component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                Crear proyecto nuevo
            </DialogTitle>
            <Divider />
            {
                !isLoadingData &&
                <Box>
                    <DialogContent sx={{ "& .MuiBox-root": { boxSizing: "border-box" } }}>

                        <DynamicForm
                            state={dynamicFormState.state}
                            show={dynamicFormState.show}
                            handlers={{
                                onDataChange: handleDataChange,
                                handleFieldChange: dynamicFormState.actions.handleFieldChange,
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
                        <StyledButton onMouseDown={() => props.setIsCreateModal(false)}>Cancelar</StyledButton>
                        <StyledButton onClick={() => handleCreateProject()} variant="contained" disabled={isLoadingData}>
                            {isLoadingData ? 'Creando...' : 'Crear Proyecto'}
                        </StyledButton>
                    </DialogActions>

                </Box>
            }
            {
                isLoadingData &&
                <LoadingAssembly state={{ message: "Creando proyecto...", borderRadius: false, boxShadow: false, size: 60 }} />
            }

        </Box>
    )
}

export default CreateProject
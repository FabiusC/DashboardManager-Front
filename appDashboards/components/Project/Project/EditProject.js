import _ from "lodash";
import { useState, useEffect, useMemo, useRef } from 'react';
import { StyledButton } from '@components/Recursive/mui_styled_components';
import { LoadingAssembly } from '@creangel/ifindit-ui';
import { pushNotification } from '@redux/actions';
import { useDispatch } from 'react-redux';
import { DynamicForm } from "@creangel/ifindit-ui";
import { useDynamicFormControls } from "@creangel/ifindit-ui/hooks";
import {
    Box,
    Typography,
    Grid,
    IconButton,
    Divider,
    Alert
} from '@mui/material';
// Icons
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Close as CloseIcon } from "@mui/icons-material";

import { editProject as editProjectService, getProjectById, getProjectDetailedData } from './services/Project';
import { fetchGroups as fetchGroupsService } from './services/Groups';
import { getRolesForProject as fetchRolesForProjectService } from './services/Groups';

const EditProject = (props) => {
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [groupsList, setGroupsList] = useState([]);
    const [rolesCache, setRolesCache] = useState({});
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [formError, setFormError] = useState("");
    const [projectData, setProjectData] = useState({});

    const fetchingRef = useRef(new Set());
    const dispatch = useDispatch();

    // === baseFormFields: siempre con valores actualizados ===
    const baseFormFields = useMemo(() => {
        const groupId = projectData.group_id;
        const roles = groupId ? rolesCache[groupId] : null;

        return [
            {
                id: "name",
                component: "input",
                value: projectData.name || '',
                title: "Nombre del proyecto",
                info: "Ingresar el nombre del proyecto",
                type: "text",
                category: "project"
            },
            {
                id: "description",
                component: "input",
                value: projectData.description || '',
                title: "Descripción",
                info: "Descripción del proyecto",
                type: "text",
                category: "project"
            },
            {
                id: "color",
                component: "color",
                value: projectData.color || '#ffce3c',
                title: "Color",
                info: "Color del proyecto",
                type: "text",
                category: "project"
            },
            {
                id: "group_id",
                component: "select",
                disabled: true,
                value: projectData.group_id || '',
                title: "Grupo",
                info: "Grupo en el que se encuentra el proyecto",
                type: "text",
                category: "Authorization",
                showValues: groupsList || []
            },
            {
                id: "view_permission_id",
                component: "select",
                value: projectData.view_permission?.rol?.id || projectData.view_role?.id || '',
                title: "Nivel de visualización",
                info: "Nivel de acceso para ver el proyecto",
                placeholder: isLoadingRoles ? "Cargando..." : (groupId ? "Selecciona nivel" : "Primero selecciona un grupo"),
                type: "text",
                category: "Authorization",
                showValues: roles?.view || [],
                disabled: isLoadingRoles || !groupId
            },
            {
                id: "edit_permission_id",
                component: "select",
                value: projectData.edit_permission?.rol?.id || projectData.edit_role?.id || '',
                title: "Nivel de edición y eliminado",
                info: "Nivel de acceso para editar y eliminar el proyecto",
                placeholder: isLoadingRoles ? "Cargando..." : (groupId ? "Selecciona nivel" : "Primero selecciona un grupo"),
                type: "text",
                category: "Authorization",
                showValues: roles?.edit || [],
                disabled: isLoadingRoles || !groupId
            },
            {
                id: "tags",
                component: "multipleOptions",
                title: "Etiquetas",
                category: "project",
                info: "Palabras clave para búsqueda",
                placeholder: 'Ej: Proyecto 1, Proyecto 2...',
                value: projectData.tags || [],
                maxTags: 5,
            },
        ];
    }, [projectData, groupsList, rolesCache, isLoadingRoles]);

    // === groupConfig ===
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

    // === DynamicFormControls ===
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
    });

    // === Handlers ===
    const handleFetchGroups = async () => {
        const params = { userToken: props.user.userID };
        await fetchGroupsService(params, { setGroupsList }, { dispatch, pushNotification });
    };

    const handleFetchRoles = async (groupId) => {
        if (rolesCache[groupId] || fetchingRef.current.has(groupId)) return;

        fetchingRef.current.add(groupId);
        setIsLoadingRoles(true);

        const params = {
            userToken: props.user.userID,
            group_id: groupId,
            type_mode: ["view", "edit"]
        };

        const stateSetters = {
            setRolesList: (data) => {
                setRolesCache(prev => ({
                    ...prev,
                    [groupId]: {
                        view: data.view || [],
                        edit: data.edit || []
                    }
                }));
            }
        };

        await fetchRolesForProjectService(params, stateSetters, { dispatch, pushNotification });
        fetchingRef.current.delete(groupId);
        setIsLoadingRoles(false);
    };

    const handleFetchProjectData = async () => {
        if (!props.editProject?.id) return;

        setIsLoadingData(true);

        const params = {
            projectId: props.editProject.id,
            userToken: props.user.userID
        };

        // 1. Obtener datos básicos del proyecto (name, description, color, tags)
        const basicDataResult = await getProjectById(params, {
            setIsLoadingData,
            setProjectData,
            setFormError
        });


        // 2. Obtener permisos completos vía ACL
        const detailedDataResult = await getProjectDetailedData(params, {
            setIsLoadingProjectDetails: () => { }, // Noop
            setProjectDetailedData: (aclData) => {
                // Merge ACL data (permissions) with basic data
                // Extraer role IDs para comparación posterior
                setProjectData(prev => ({
                    ...prev,
                    view_permission: aclData.view_permission,
                    edit_permission: aclData.edit_permission,
                    view_role_id: aclData.view_permission?.rol?.id || aclData.view_role?.id,
                    edit_role_id: aclData.edit_permission?.rol?.id || aclData.edit_role?.id
                }));
            }
        });

        // 3. Obtener roles si tenemos group_id
        if (basicDataResult.success && basicDataResult.data?.group_id) {
            await handleFetchRoles(basicDataResult.data.group_id);
        }

        setIsLoadingData(false);
    };

    const handleEditProject = async () => {
        const data = dynamicFormState.actions.getFormData();

        const params = {
            editProjectData: projectData,
            projectForm: data,
            userToken: props.user.userID,
        };

        const stateSetters = { setIsLoadingData, dispatch };
        const callbacks = {
            setEditingId: props.setEditingId,
            handleProject: props.handleProject,
            pushNotification
        };

        setIsLoadingData(true);
        const result = await editProjectService(params, stateSetters, callbacks);
        setIsLoadingData(false);

        if (!result.success) {
            setFormError(result.error || "Error al guardar el proyecto");
        }
    };

    // === Carga inicial: DEPENDE DE props.editProject ===
    useEffect(() => {
        handleFetchGroups();
        if (props.editProject?.id) {
            handleFetchProjectData();
        } else if (props.editProject && Object.keys(props.editProject).length > 0) {
            setProjectData(props.editProject);
            if (props.editProject.group_id) {
                handleFetchRoles(props.editProject.group_id);
            }
        } else {
            dispatch(pushNotification({ msg: "Proyecto no disponible", status: "err" }));
        }
    }, [props.editProject]);

    const formKey = useMemo(() => {
        const roles = projectData.group_id ? rolesCache[projectData.group_id] : null;
        return `project-${projectData.id || 'new'}-${projectData.name || ''}-${projectData.color || ''}-${JSON.stringify(projectData.tags || [])}-${JSON.stringify(roles || {})}`;
    }, [projectData, rolesCache]);

    return (
        <Box
            className="pad_35"
            sx={{
                position: 'relative',
                backgroundColor: '#fff',
                borderRadius: 2,
                boxShadow: 3,
            }}
        >
            <IconButton
                onClick={() => props.setEditingId(null)}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    padding: '6px',
                    backgroundColor: '#f0f0f0',
                    '&:hover': { backgroundColor: '#e0e0e0' },
                }}
            >
                <CloseIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                Edición del Proyecto
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            {isLoadingData ? (
                <LoadingAssembly state={{ message: "Cargando datos...", borderRadius: false, boxShadow: false, size: 60 }} />
            ) : (
                <>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError("")}>
                            {formError}
                        </Alert>
                    )}

                    <DynamicForm
                        key={formKey}
                        state={dynamicFormState.state}
                        show={dynamicFormState.show}
                        handlers={{
                            handleFieldChange: dynamicFormState.actions.handleFieldChange
                        }}
                        sx={{
                            '& .MuiBox-root > .MuiBox-root > .MuiBox-root > .MuiBox-root > .MuiBox-root': {
                                gridTemplateColumns: '1fr !important'
                            }
                        }}
                    />

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <StyledButton
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={() => props.setEditingId(null)}
                            >
                                Cancelar
                            </StyledButton>
                            <StyledButton
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleEditProject}
                                disabled={isLoadingData}
                            >
                                Guardar
                            </StyledButton>
                        </Box>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default EditProject;
/* 
Name: EditFolder
Action: edit folder's information
*/

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
import FolderIcon from '@mui/icons-material/Folder';
import SecurityIcon from '@mui/icons-material/Security';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Close } from "@mui/icons-material";

import { editFolder as editFolderService, getFolderById, getFolderDetailedData } from './services/Folder';
import { fetchGroups as fetchGroupsService } from '../Project/services/Groups';
import { getRolesForFolder as fetchRolesForFolderService } from '../Project/services/Groups';

const EditFolder = (props) => {
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [groupsList, setGroupsList] = useState([]);
    const [rolesCache, setRolesCache] = useState({});
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [formError, setFormError] = useState("");
    const [folderData, setFolderData] = useState({});

    const fetchingRef = useRef(new Set());
    const dispatch = useDispatch();

    // === baseFormFields: siempre con valores actualizados ===
    const baseFormFields = useMemo(() => {
        const groupId = folderData.group_id;
        const roles = groupId ? rolesCache[groupId] : null;

        return [
            {
                id: "name",
                component: "input",
                value: folderData.name || '',
                title: "Nombre de la carpeta",
                info: "Ingresar el nombre de la carpeta",
                type: "text",
                category: "folder"
            },
            {
                id: "description",
                component: "input",
                value: folderData.description || '',
                title: "Descripción",
                info: "Descripción de la carpeta",
                type: "text",
                category: "folder"
            },
            {
                id: "color",
                component: "color",
                value: folderData.color || '#ffce3c',
                title: "Color",
                info: "Color de la carpeta",
                type: "text",
                category: "folder"
            },
            {
                id: "group_id",
                component: "select",
                disabled: true,
                value: folderData.group_id || '',
                title: "Grupo",
                info: "Grupo en el que se encuentra la carpeta",
                type: "text",
                category: "Authorization",
                showValues: groupsList || []
            },
            {
                id: "view_permission_id",
                component: "select",
                value: folderData.view_permission?.rol?.id || folderData.view_role?.id || '',
                title: "Nivel de visualización",
                info: "Nivel de acceso para ver la carpeta",
                placeholder: isLoadingRoles ? "Cargando..." : (groupId ? "Selecciona nivel" : "Primero selecciona un grupo"),
                type: "text",
                category: "Authorization",
                showValues: roles?.view || [],
                disabled: isLoadingRoles || !groupId
            },
            {
                id: "edit_permission_id",
                component: "select",
                value: folderData.edit_permission?.rol?.id || folderData.edit_role?.id || '',
                title: "Nivel de edición y eliminado",
                info: "Nivel de acceso para editar y eliminar la carpeta",
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
                category: "folder",
                info: "Palabras clave para búsqueda",
                placeholder: 'Ej: Carpeta 1, Carpeta 2...',
                value: folderData.tags || [],
                maxTags: 10,
            },
        ];
    }, [folderData, groupsList, rolesCache, isLoadingRoles]);

    const groupConfig = useMemo(() => ({
        order: ['folder', 'Authorization'],
        labels: {
            folder: 'Información de la Carpeta',
            Authorization: 'Información de Autorización'
        },
        icons: {
            folder: <FolderIcon sx={{ fontSize: '20px', color: 'primary.main' }} />,
            Authorization: <SecurityIcon sx={{ fontSize: '20px', color: 'primary.main' }} />
        }
    }), []);

    const dynamicFormState = useDynamicFormControls({
        state: {
            fields: baseFormFields,
            groupConfig: groupConfig,
            isLoadingSelects: isLoadingRoles,
            isExtended: true
        },
        show: { form: true },
    });

    // === Handlers ===
    const handleFetchGroups = async () => {
        await fetchGroupsService(
            { userToken: props.user.userID },
            { setGroupsList },
            { dispatch, pushNotification }
        );
    };

    const handleFetchRoles = async (groupId) => {
        if (rolesCache[groupId] || fetchingRef.current.has(groupId)) return;

        fetchingRef.current.add(groupId);
        setIsLoadingRoles(true);

        const projectId = sessionStorage.getItem('projectId');
        const params = {
            userToken: props.user.userID,
            group_id: groupId,
            type_mode: ["view", "edit"],
            parent_project_id: projectId
        };

        const stateSetters = {
            setRolesList: (data) => {
                setRolesCache(prev => ({
                    ...prev,
                    [groupId]: { view: data.view || [], edit: data.edit || [] }
                }));
            }
        };

        await fetchRolesForFolderService(params, stateSetters, { dispatch, pushNotification });
        fetchingRef.current.delete(groupId);
        setIsLoadingRoles(false);
    };

    const handleFetchFolderData = async () => {
        if (!props.editFolder?.id) return;

        setIsLoadingData(true);
        setFolderData({}); // Reset folderData before fetching new data
        setFormError(""); // Clear any previous form errors

        const params = { folderId: props.editFolder.id, userToken: props.user.userID };

        // 1. Obtener datos básicos de la carpeta (name, description, color, tags)
        const basicDataResult = await getFolderById(params, {
            setIsLoadingData,
            setFolderData,
            setFormError
        });

        // 2. Obtener permisos completos vía ACL
        const detailedDataResult = await getFolderDetailedData(params, {
            setIsLoadingFolderDetails: () => { }, // Noop to control loading externally
            setFolderDetailedData: (aclData) => {
                // Merge ACL data (permissions) with basic data
                // Extraer role IDs para comparación posterior
                setFolderData(prev => ({
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

    const handleEditFolder = async () => {
        const data = dynamicFormState.actions.getFormData();
        const params = {
            editFolderData: folderData,
            folderForm: data,
            userToken: props.user.userID
        };

        const stateSetters = { setIsLoadingData, dispatch };
        const callbacks = { setEditingId: props.setEditingId, handleFolder: props.handleFolder, pushNotification };

        setIsLoadingData(true);
        const result = await editFolderService(params, stateSetters, callbacks);
        setIsLoadingData(false);

        if (!result.success) {
            setFormError(result.error || "Error al guardar la carpeta");
        }
    };

    // === Carga inicial ===
    useEffect(() => {
        handleFetchGroups();
        if (props.editFolder?.id) {
            handleFetchFolderData();
        } else if (props.editFolder && Object.keys(props.editFolder).length > 0) {
            setFolderData(props.editFolder);
        } else {
            dispatch(pushNotification({ msg: "Servicio no disponible", status: "err" }));
        }
    }, [props.editFolder]);

    // === CLAVE: Forzar remount del formulario ===
    const formKey = useMemo(() => {
        const roles = folderData.group_id ? rolesCache[folderData.group_id] : null;
        return `folder-${folderData.id || 'new'}-${folderData.name || ''}-${folderData.color || ''}-${JSON.stringify(folderData.tags || [])}-${JSON.stringify(roles || {})}`;
    }, [folderData, rolesCache]);

    return (
        <Box className="pad_35" sx={{ position: 'relative', bgcolor: '#fff', borderRadius: 2, boxShadow: 3 }}>
            <IconButton
                onClick={() => props.setEditingId(null)}
                sx={{ position: 'absolute', right: 8, top: 8, bgcolor: '#f0f0f0', '&:hover': { bgcolor: '#e0e0e0' } }}
            >
                <Close />
            </IconButton>

            <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                Edición de la Carpeta
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {isLoadingData ? (
                <LoadingAssembly state={{ message: "Cargando...", size: 60 }} />
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
                            '& .MuiBox-root[style*="grid-template-columns"]': {
                                gridTemplateColumns: '1fr !important'
                            }
                        }}
                    />

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <StyledButton variant="outlined" startIcon={<CancelIcon />} onClick={() => props.setEditingId(null)}>
                                Cancelar
                            </StyledButton>
                            <StyledButton variant="contained" startIcon={<SaveIcon />} onClick={handleEditFolder} disabled={isLoadingData}>
                                Guardar
                            </StyledButton>
                        </Box>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default EditFolder;
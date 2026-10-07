import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { connect, useDispatch } from 'react-redux';
import {
    Container,
    Box,
    Card,
    CardActionArea,
    CardContent,
    Divider,
    FormControl,
    InputAdornment,
    Menu,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
    Dialog,
    IconButton,
    Pagination,
    ListItemIcon
} from '@mui/material';
import { getContrastColor, StyledButton } from '../../Recursive/mui_styled_components';
import { LoadingAssembly } from '@creangel/ifindit-ui';
import { getUserInfo } from '../../../services/creangelAuthAPI';
import { validatorAPIBasicParameters } from '../../../source/validators';
import { validateExpirationTime } from '../../../source/recursiveSecurity';
import DeleteModal from '../../Recursive/DeleteModal';
import ViewPanel from './ViewPanel';
import moment from 'moment';
import 'moment/locale/es';
import AuthAdapter from '../../../adapters/authAdapter';
import BreadcrumbsNav from '../Breadcrumbs';
import { handleEditItemEntity, handleList } from '../../../helpers/dashboardAPI/genericRequest';
import { clearSessionStorage } from '../../../utilities/sessionStorageUtils';
//===== ICONS =====
import { 
    CalendarMonth, 
    CreateNewFolder, 
    Delete, 
    Edit, 
    PeopleAltRounded, 
    PersonRounded, 
    Search, 
    Star, 
    StarBorder,
    MoreHorizRounded,
    VisibilityRounded,
    LockRounded,
    LockOpenRounded,
    UnpublishedRounded,
    CheckCircleRounded,
    PieChart
} from '@mui/icons-material';
import { MarqueeText } from '../../Recursive/MarqueeText';


moment.locale('es')

function Panels(props) {
    const [isViewModal, setIsViewModal] = useState(false);
    const [isDeleteModal, setIsDeleteModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [panels, setPanels] = useState([]);
    const [selectedPanel, setSelectedPanel] = useState(null);
    const [userNames, setUserNames] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPanels, setTotalPanels] = useState(0);
    const [viewMode, setViewMode] = useState(() => {
                return sessionStorage.getItem('viewMode') || 'list';
            });
    const [panelsPerPage, setPanelsPerPage] = useState(4)
    const [filters, setFilters] = useState([]);

    const [anchorEl, setAnchorEl] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const router = useRouter();
    const dispatch = useDispatch();
    const authAdapter = new AuthAdapter();


    useEffect(() => {
        clearSessionStorage(['panelId']);
        let sessionProjectId = sessionStorage.getItem('projectId');
        let sessionProjectName = sessionStorage.getItem('projectName');
        let sessionFolderId = sessionStorage.getItem('folderId');
        let sessionFolderName = sessionStorage.getItem('folderName');
        let sessionResourceId = sessionStorage.getItem('resourceId');
        let sessionResourceName = sessionStorage.getItem('resourceName');
        if (sessionProjectId && sessionProjectName && sessionFolderId && sessionFolderName && sessionResourceId && sessionResourceName) {
            setFilters([{ field: 'folder_resource_id', value: sessionResourceId }]);
        } else {
            router.push('/projects');
        }
    }, []);

    useEffect(() => {        
        if (filters.length > 0) {
            getPanelList(panels.length === 0);
        }
    }, [filters, searchTerm, currentPage, panelsPerPage]);

    useEffect(() => {
        if (viewMode === 'list') {
            setPanelsPerPage(4)
            setCurrentPage(1)
        } else if (viewMode === 'medium-icons') {
            setPanelsPerPage(21)
            setCurrentPage(1)
        } else {
            setPanelsPerPage(8)
            setCurrentPage(1)
        }
        sessionStorage.setItem('viewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        const fetchUserNames = async () => {
            const userIds = [...new Set(panels.map(panel => panel.user_creator_id))];
            const names = { ...userNames };

            for (const userId of userIds) {
                if (!names[userId]) {
                    const userInfo = await handleGetUserInfo(props.user[0], userId);

                    const groupId = panels.find((panel) => panel.user_creator_id === userId)?.group_id;
                    const groupName = userInfo?.permissions?.find((permission) => permission.group.id === groupId)?.group.name || "Grupo no encontrado";

                    names[userId] = {
                        username: userInfo?.username || "Usuario no encontrado",
                        groupName,
                    }
                }
            }
            setUserNames(names);
        };

        fetchUserNames();
    }, [panels]);

    const getPanelList = async ( showLoading = false ) => {

        if (showLoading) {
            setIsLoadingList(true);
        }   
        const fieldsSearch = ["title", "description", "tags"]
        const response = await handleList(dispatch, props.user[0].userID, 'panelList', 'paneles', filters, panelsPerPage, searchTerm, currentPage, fieldsSearch);
        if (response) {
            setPanels(response["results"]);
            setTotalPanels(response["count"]);
        }
        setIsLoadingList(false);
    };

    const handleContextMenu = (event, item) => {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
        setMenuPosition({ x: event.clientX, y: event.clientY });
        setSelectedPanel(item);
    }

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleGetUserInfo = async (user, userIdentity) => {
        setIsLoadingList(true)
        let stateExpiration = validateExpirationTime(user.userData.expiration)
        if (stateExpiration) {
            let requestHeader = {
                'Authorization': 'Bearer ' + user.userID,
                'Content-Type': 'application/json'
            }
            let requestBody = {
                "user_id": userIdentity,
            }
            let responseUserInfo = await getUserInfo(requestBody, requestHeader)
            let userInfo = [];
            if (authAdapter.checkUsersInfo(responseUserInfo["data"])) {
                userInfo = authAdapter.adaptUsersObject(responseUserInfo["data"]);
            }
            const [validResponseUserInfo, responseContentUserInfo] = validatorAPIBasicParameters(responseUserInfo);
            if (validResponseUserInfo) {
                if (responseContentUserInfo?.status == "ok" || responseContentUserInfo?.status == true) {
                    setIsLoadingList(false)
                    return userInfo
                } else {
                    setIsLoadingList(false)
                    return null
                }
            }
        } else {
            setIsLoadingList(false)
            dispatch(removeUserInfo());
        }
    }

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
        getPanelList();
    };

    const handleEdit = (panel) => {
        sessionStorage.setItem('panelId', panel);
        router.push("../panelsWorkspace")
    };

    const handleDelete = () => {
        setIsDeleteModal(true)
        setAnchorEl(null);
    }

    const handleView = () => {
        setIsViewModal(true)
        setAnchorEl(null);
    }

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        setCurrentPage(1);
        getPanelList();
    };

    const handleViewChange = (event) => {
        setViewMode(event.target.value);
    };

    const handleEditStates = async (stateKey, panel) => {
        const requestBody = {
            [stateKey]: !panel[stateKey]
        }
        const id = { id: panel.id }
        const response = await handleEditItemEntity(props.user[0].userID, 'panel', 'panel', id, requestBody, dispatch);
        if (response) {
            getPanelList()
        }
    }

    const handleCreatePanel = () => {
        router.push("../panelsWorkspace")
    };

    const handleChangeStates = (stateKey, panel) => {
        setSelectedPanel(panel)
        handleEditStates(stateKey, panel);
    }

    const renderTooltip = (panel) => {        
        return (
            <Box sx={{ marginTop: 1, padding: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ color: '#FFFFF', display: 'flex', alignItems: 'center', gap: 1 }}><PersonRounded sx={{ fontSize: '16px' }} /> Creador: {userNames[panel.user_creator_id]?.username}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: '#FFFFF', display: 'flex', alignItems: 'center', gap: 1 }}><PeopleAltRounded sx={{ fontSize: '16px' }} />Grupo: {userNames[panel.user_creator_id]?.groupName}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: '#FFFFF', display: 'flex', alignItems: 'center', gap: 1 }}><CalendarMonth sx={{ fontSize: '16px' }} />Fecha de creación {moment(panel.created_at).format("LLLL")}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: '#FFFFF', display: 'flex', alignItems: 'center', gap: 1 }}><CalendarMonth sx={{ fontSize: '16px' }} />Fecha de edición {moment(panel.edited_at).format("LLLL")}</Typography>
            </Box>
        )
    }


    return (
        <Container maxWidth={false} sx={{ p: '24px', maxWidth: '1400px' }}>
            <Paper elevation={1} sx={{ padding: 4, minHeight: '50vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                    <Typography variant="h4" noWrap component="h1" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                        Administración de paneles
                    </Typography>
                    <Box className='right_horz mt_10 mb_10'>
                        <StyledButton
                            variant="contained"
                            onClick={() => handleCreatePanel()}
                        >
                            <CreateNewFolder />
                            <Typography noWrap component="div" sx={{ fontSize: "14px", marginLeft: "5px" }}>
                                <span>Crear Panel</span>
                            </Typography>
                        </StyledButton>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                    <BreadcrumbsNav />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ width: { xs: '100%', sm: '100%', md: '70%', } }} autoComplete="off">
                            <TextField
                                variant="outlined"
                                placeholder="Buscar paneles..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e)}
                                autoComplete="off"
                                name="custom-search-users"
                                inputProps={{
                                    autoComplete: 'off',
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: '100%' }}
                                size='small'
                            />
                        </Box>
                        <Box sx={{ width: '30%', display: 'flex', justifyContent: 'flex-end' }}>
                            <FormControl variant="outlined" sx={{ minWidth: 100 }}>
                                <Select
                                    value={viewMode}
                                    onChange={handleViewChange}
                                    sx={{ backgroundColor: 'white', borderRadius: 1 }}
                                    renderValue={() => (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {viewMode === 'large-icons' && <i className="fas fa-th-large"></i>}
                                            {viewMode === 'medium-icons' && <i className="fas fa-th"></i>}
                                            {viewMode === 'list' && <i className="fas fa-bars"></i>}
                                            <Typography sx={{ fontWeight: '500', fontSize: '14px' }}>
                                                Ver
                                            </Typography>
                                        </Box>
                                    )}
                                    size='small'
                                >
                                    <MenuItem value="large-icons" sx={{ display: 'flex', gap: 2 }}><i className="fas fa-th-large"></i> Iconos Grandes</MenuItem>
                                    <MenuItem value="medium-icons" sx={{ display: 'flex', gap: 2 }}><i className="fas fa-th"></i> Iconos Medianos</MenuItem>
                                    <MenuItem value="list" sx={{ display: 'flex', gap: 2 }}><i className="fas fa-bars"></i> Lista</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Box>
                {isLoadingList &&
                    <Box sx={{ minHeight: '50vh', display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', alignItems: 'center' }}>
                        <LoadingAssembly state={{message: "Cargando paneles...", borderRadius: false, boxShadow: false, size: 60}} />
                    </Box>
                }
                {panels.length === 0 && !isLoadingList &&  (
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            mt: 2,
                            minHeight: '50vh'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            No existen paneles asociados al proyecto.
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Los paneles aparecerán aquí cuando se hayan creado.
                        </Typography>
                    </Paper>
                )}
                {!isLoadingList && panels.length > 0 && (
                    <Box sx={{ minHeight: '50vh' }}>
                        <Box
                            sx={{
                                display: viewMode === 'list' ? 'block' : 'grid',
                                gridTemplateColumns:
                                    viewMode === 'large-icons' ? 'repeat(auto-fill, minmax(250px, 1fr))' :
                                        viewMode === 'medium-icons' ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'unset',
                                gap: 2
                            }}
                        >
                            {panels.map((panel) => {
                                if(viewMode === 'list') {
                                    return (
                                <Card key={panel.id} sx={{ mb: 1 }}>
                                    <CardActionArea component="div">
                                        <CardContent sx={{ p: '0' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'flex-start', gap: 1.5 }}>
                                                <Box
                                                    onContextMenu={(e) => handleContextMenu(e, panel)} onClick={() => handleEdit(panel.id)}
                                                    sx={{
                                                        width: '120px',
                                                        height: '110px',
                                                        borderRadius: '3px',
                                                        backgroundColor: "#F8F9FA",
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <PieChart sx={{ fontSize: 50, color: 'primary.main' }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.1, width: '90%', padding: '8px' }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                                                            <Tooltip title={renderTooltip(panel)} enterDelay={1500} enterTouchDelay={1000} enterNextDelay={500} followCursor={true}
                                                                sx={{
                                                                    '& .MuiTooltip-tooltip': {
                                                                        padding: '0px !important'
                                                                    }
                                                                }}
                                                            >
                                                                <Box sx={{ width: '80%' }} onContextMenu={(e) => handleContextMenu(e, panel)} onClick={() => handleEdit(panel.id)}>
                                                                    <Typography variant="h6">{panel.title}</Typography>
                                                                </Box>
                                                            </Tooltip>
                                                            <Box sx={{ display: 'flex', flexDirection: 'row', width: '20%', justifyContent: 'flex-end' }}>                                                              
                                                                <Tooltip title={panel.is_published ? 'Cambiar a solo es visible para mí' : 'Habilitar visibilidad para todos'}>
                                                                    <IconButton
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleChangeStates("is_published", panel)
                                                                        }}
                                                                    >
                                                                        {panel.is_published ? <CheckCircleRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} /> : <UnpublishedRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} />}
                                                                    </IconButton>
                                                                </Tooltip>

                                                                <Tooltip title={panel.is_public ? 'Activar autorización' : 'Desactivar autorización'}>
                                                                    <IconButton
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleChangeStates("is_public", panel)
                                                                        }}
                                                                    >
                                                                        {panel.is_public ? <LockOpenRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} /> : <LockRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} />}
                                                                    </IconButton>
                                                                </Tooltip>

                                                                <Tooltip title={'Más opciones'}>
                                                                    <IconButton
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleContextMenu(e, panel, 20)
                                                                        }}
                                                                    >
                                                                        {<MoreHorizRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} />}
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    <Tooltip title={renderTooltip(panel)} enterDelay={1500} enterTouchDelay={1000} enterNextDelay={500} followCursor={true}
                                                        sx={{
                                                            '& .MuiTooltip-tooltip': {
                                                                padding: '0px !important'
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }} onContextMenu={(e) => handleContextMenu(e, panel)} onClick={() => handleEdit(panel.id)}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <Typography variant="caption" color="text.secondary"><strong>Descripción: </strong>{panel.description != "" ? panel.description : "Sin descripción"}</Typography>
                                                                    <Typography variant="caption" color="text.secondary"><strong>Fecha de creación: </strong>{moment(panel.created_at).format("LLLL")}</Typography>
                                                                    <Typography variant="caption" color="text.secondary"><strong>Fecha de modificación: </strong>{moment(panel.edited_at).format("LLLL")}</Typography>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            )}
                                else {
                                    return (
                                        <Card
                                        key={panel.id}
                                        sx={{
                                        height: viewMode === "large-icons" ? "250px" : "180px",
                                        display: "flex",
                                        flexDirection: "column",
                                        }}
                                        >
                                        <Tooltip
                                                title={renderTooltip(panel)}
                                                enterDelay={1500}
                                                enterTouchDelay={1000}
                                                enterNextDelay={500}
                                                followCursor={true}
                                                sx={{
                                                "& .MuiTooltip-tooltip": {
                                                    padding: "0px !important",
                                                },
                                                }}
                                            >
                                        <CardActionArea
                                        component="div"
                                        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
                                        onContextMenu={(e) => handleContextMenu(e, panel)}
                                        onClick={() => handleEdit(panel.id)}
                                        >
                                        <Box
                                            sx={{
                                            flex: 1,
                                            width: "100%",
                                            backgroundColor: "#F8F9FA",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            }}
                                        >
                                            <PieChart sx={{ fontSize: 50, color: 'primary.main' }} />
                                        </Box>
                                        <CardContent sx={{ p: 1, flex: "none", width: "100%", boxSizing: "border-box" }}>
                                             <MarqueeText
                                                text={panel.title}
                                                variant={viewMode === "large-icons" ? "subtitle1" : "body2"}
                                                maxWidth="100%"
                                                sx={{
                                                fontWeight: "medium",
                                                }}
                                            />
                                        </CardContent>
                                        </CardActionArea>
                                        </Tooltip>
                                        <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            p: 1,
                                            backgroundColor: "#F8F9FA",                                            
                                        }}
                                        >
                                        <Tooltip
                                            title={
                                            panel.is_published ? "Cambiar a solo es visible para mí" : "Habilitar visibilidad para todos"
                                            }
                                        >
                                            <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleChangeStates("is_published", panel)
                                            }}
                                            >
                                            {panel.is_published ? (
                                                <CheckCircleRounded sx={{ color: "#a5a5a5", fontSize: "18px" }} />
                                            ) : (
                                                <UnpublishedRounded sx={{ color: "#a5a5a5", fontSize: "18px" }} />
                                            )}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={panel.is_public ? "Activar autorización" : "Desactivar autorización"}>
                                            <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleChangeStates("is_public", panel)
                                            }}
                                            >
                                            {panel.is_public ? (
                                                <LockOpenRounded sx={{ color: "#a5a5a5", fontSize: "18px" }} />
                                            ) : (
                                                <LockRounded sx={{ color: "#a5a5a5", fontSize: "18px" }} />
                                            )}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={"Más opciones"}>
                                            <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleContextMenu(e, panel, 20)
                                            }}
                                            >
                                            {<MoreHorizRounded sx={{ color: "#a5a5a5", fontSize: "18px" }} />}
                                            </IconButton>
                                        </Tooltip>
                                        </Box>
                                    </Card>
                                    )
                                }
                              })}
                            </Box>
                          </Box>
                        )}
                        {selectedPanel && (
                            <Menu
                                elevation={2}
                                anchorReference="anchorPosition"
                                anchorPosition={anchorEl ? { top: menuPosition.y, left: menuPosition.x } : undefined}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                sx={{ boxShadow: 4 }}
                            >
                                <MenuItem onClick={() => handleView()}>
                                <ListItemIcon>
                                    <VisibilityRounded />
                                </ListItemIcon>
                                Ver más
                                </MenuItem>
                                <MenuItem onClick={() => handleEdit(selectedPanel.id)}>
                                <ListItemIcon>
                                    <Edit />
                                </ListItemIcon>
                                Editar
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={() => handleDelete()}>
                                <ListItemIcon>
                                    <Delete />
                                </ListItemIcon>
                                Eliminar
                                </MenuItem>
                            </Menu>
                            )}
                {totalPanels > panelsPerPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                        <Pagination
                            count={Math.ceil(totalPanels / panelsPerPage)}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                            sx={{
                                '& .MuiPaginationItem-root.Mui-selected': {
                                    color: theme => getContrastColor(theme.palette.primary.main),
                                }
                            }}
                        />
                    </Box>
                )}
                <DeleteModal
                    open={isDeleteModal}
                    onClose={() => setIsDeleteModal(false)}
                    user={props.user[0]}
                    titleToDelete={selectedPanel?.title}
                    idToDelete={selectedPanel?.id}
                    entityType="panel"
                    entityName="panel"
                    entityIdField="panel_id"
                    onSuccess={getPanelList}
                    customTitle="Eliminación de panel"
                />
                <Dialog open={isViewModal} onClose={() => setIsViewModal(false)}
                    sx={{
                        '& .MuiDialog-paper': {
                            maxWidth: '900px',
                            width: '100%',
                        }
                    }}
                >
                    <ViewPanel
                        setIsViewModal={setIsViewModal}
                        viewPanel={selectedPanel}
                        dimensions={props.dimensions}
                    />
                </Dialog>
            </Paper>
        </Container>
    )
}


const mapStateToProps = state => {
    return {
        user: state.user,
        organization: state.organization,
        actions: state.actions,
        permissions: state.permissions,
        dimensions: state.dimensions
    };
};

export default connect(mapStateToProps)(Panels); 
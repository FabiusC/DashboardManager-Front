import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { connect, useDispatch } from 'react-redux';
import { Container, Box, Card, CardActionArea, CardContent, Divider, FormControl, InputAdornment, ListItemIcon, Menu, MenuItem, Paper, Select, TextField, Tooltip, Typography, Dialog, IconButton, Pagination } from '@mui/material';
import { CalendarMonth, CreateNewFolder, Delete, Edit, FolderRounded, PeopleAltRounded, PersonRounded, Search, Star, StarBorder, Visibility, AccountTreeOutlined, CheckCircleRounded, LockOpenRounded, LockRounded, UnpublishedRounded, MoreHorizRounded, VisibilityRounded } from '@mui/icons-material';
import { getContrastColor, StyledButton } from '../../Recursive/mui_styled_components';
import { LoadingData } from '@creangel/ifindit-ui';
import { getUserInfo } from '../../../services/creangelAuthAPI';
import { validatorAPIBasicParameters } from '../../../source/validators';
import { validateExpirationTime } from '../../../source/recursiveSecurity';
import moment from 'moment';
import 'moment/locale/es';
import AuthAdapter from '../../../adapters/authAdapter';
import BreadcrumbsNav from '../Breadcrumbs';
import { handleEditItemEntity, handleList } from '../../../helpers/dashboardAPI/genericRequest';
import { MarqueeText } from '../../Recursive/MarqueeText';
import ViewDashboard from './viewDashboard';
import DeleteModal from '../../Recursive/DeleteModal';
import { clearSessionStorage } from '../../../utilities/sessionStorageUtils';
import DashboardIcon from '@mui/icons-material/Dashboard';

moment.locale('es')

function Dashboards({dashboard, userName}) {
    const [isViewModal, setIsViewModal] = useState(false);
    const [isDeleteModal, setIsDeleteModal] = useState(false);
    const [selectedDashboard, setSelectedDashboard] = useState(null);
    
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const router = useRouter();
    const dispatch = useDispatch();
    const authAdapter = new AuthAdapter();

  
    // useEffect(() => {
    //     const fetchUserNames = async () => {
    //         const userIds = [...new Set(dashboards.map(dashboard => dashboard.user_creator_id))];
    //         const names = { ...userNames };

    //         for (const userId of userIds) {
    //             if (!names[userId]) {
    //                 const userInfo = await handleGetUserInfo(props.user[0], userId);

    //                 const groupId = dashboards.find((dashboard) => dashboard.user_creator_id === userId)?.group_id;
    //                 const groupName = userInfo?.permissions?.find((permission) => permission.group.id === groupId)?.group.name || "Grupo no encontrado";

    //                 names[userId] = {
    //                     username: userInfo?.username || "Usuario no encontrado",
    //                     groupName,
    //                 }
    //             }
    //         }
    //         setUserNames(names);
    //     };

    //     // fetchUserNames();
    // }, [dashboards]);

 

    

    const handleContextMenu = (event, item) => {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
        setMenuPosition({ x: event.clientX, y: event.clientY });
        setSelectedDashboard(item);
    }

    const handleClose = () => {
        setAnchorEl(null);
    };

    // const handleGetUserInfo = async (user, userIdentity) => {
    //     setIsLoadingList(true)
    //     let stateExpiration = validateExpirationTime(user.userData.expiration)
    //     if (stateExpiration) {
    //         let requestHeader = {
    //             'Authorization': 'Bearer ' + user.userID,
    //             'Content-Type': 'application/json'
    //         }
    //         let requestBody = {
    //             "user_id": userIdentity,
    //         }
    //         let responseUserInfo = await getUserInfo(requestBody, requestHeader)
    //         let userInfo = [];
    //         if (authAdapter.checkUsersInfo(responseUserInfo["data"])) {
    //             userInfo = authAdapter.adaptUsersObject(responseUserInfo["data"]);
    //         }
    //         const [validResponseUserInfo, responseContentUserInfo] = validatorAPIBasicParameters(responseUserInfo);
    //         if (validResponseUserInfo) {
    //             if (responseContentUserInfo?.status == "ok" || responseContentUserInfo?.status == true) {
    //                 setIsLoadingList(false)
    //                 return userInfo
    //             } else {
    //                 setIsLoadingList(false)
    //                 return null
    //             }
    //         }
    //     } else {
    //         setIsLoadingList(false)
    //         dispatch(removeUserInfo());
    //     }
    // }



    const handleEdit = (dashboard) => {
        sessionStorage.setItem('dashboardId', dashboard);
        router.push("../dashboardsWorkspace")
    };

    const handleDelete = () => {
        setIsDeleteModal(true)
        setAnchorEl(null);
    }

    const handleView = () => {
        setIsViewModal(true);
        setAnchorEl(null);
    }

    
    

    const handleEditStates = async (stateKey, dashboard) => {
        const requestBody = {
            [stateKey]: !dashboard[stateKey]
        }
        const id = { id: dashboard.id }
        const response = await handleEditItemEntity(props.user[0].userID, 'dashboard', 'tablero', id, requestBody, dispatch);
        if (response) {
            getDashboardList()
        }
    }

    const handleCreateDashboard = () => {
        router.push("../dashboardsWorkspace");
    };

    const handleChangeStates = (stateKey, dashboard) => {
        setSelectedDashboard(dashboard)
        handleEditStates(stateKey, dashboard);
    }

    const renderTooltip = (dashboard) => {
        return (
            <Box sx={{ marginTop: 1, padding: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ color: '#FFFFF', display: 'flex', alignItems: 'center', gap: 1 }}><PersonRounded sx={{ fontSize: '16px' }} /> Creador: {userNames[dashboard.user_creator_id]?.username}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: '#FFFFF', display: 'flex', alignItems: 'center', gap: 1 }}><PeopleAltRounded sx={{ fontSize: '16px' }} />Grupo: {userNames[dashboard.user_creator_id]?.groupName}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: '#FFFFF', display: 'flex', alignItems: 'center', gap: 1 }}><CalendarMonth sx={{ fontSize: '16px' }} />Fecha de creación {moment(dashboard.created_at).format("LLLL")}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: '#FFFFF', display: 'flex', alignItems: 'center', gap: 1 }}><AccountTreeOutlined sx={{ fontSize: '16px' }} />Número de pipelines {dashboard.tasks_count}</Typography>
            </Box>
        )
    }

    return (
        <>


            {(viewMode === 'list') && (

                <Card key={dashboard.id} sx={{ mb: 1 }}>
                    <CardActionArea>
                        <CardContent sx={{ p: '0' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'flex-start', gap: 1.5 }}>
                                <Box
                                    onContextMenu={(e) => handleContextMenu(e, dashboard)} onClick={() => handleEdit(dashboard.id)}
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
                                    <DashboardIcon sx={{ fontSize: 50, color: 'primary.main' }} />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.1, width: '90%', padding: '8px' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                                            <Tooltip title={renderTooltip(dashboard)} enterDelay={1500} enterTouchDelay={1000} enterNextDelay={500} followCursor={true}
                                                sx={{
                                                    '& .MuiTooltip-tooltip': {
                                                        padding: '0px !important'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ width: '80%' }} onContextMenu={(e) => handleContextMenu(e, dashboard)} onClick={() => handleEdit(dashboard.id)}>
                                                    <Typography variant="h6">{dashboard.name}</Typography>
                                                </Box>
                                            </Tooltip>
                                            <Box sx={{ display: 'flex', flexDirection: 'row', width: '20%', justifyContent: 'flex-end' }}>
                                                <Tooltip title={dashboard.is_published ? 'Cambiar a solo es visible para mí' : 'Habilitar visibilidad para todos'}>
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeStates("is_published", dashboard)
                                                        }}
                                                    >
                                                        {dashboard.is_published ? <CheckCircleRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} /> : <UnpublishedRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} />}
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title={dashboard.is_public ? 'Activar autorización' : 'Desactivar autorización'}>
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeStates("is_public", dashboard)
                                                        }}
                                                    >
                                                        {dashboard.is_public ? <LockOpenRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} /> : <LockRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} />}
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title={'Más opciones'}>
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleContextMenu(e, dashboard, 20)
                                                        }}
                                                    >
                                                        {<MoreHorizRounded sx={{ color: "#a5a5a5", fontSize: '20px' }} />}
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Tooltip title={renderTooltip(dashboard)} enterDelay={1500} enterTouchDelay={1000} enterNextDelay={500} followCursor={true}
                                        sx={{
                                            '& .MuiTooltip-tooltip': {
                                                padding: '0px !important'
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }} onContextMenu={(e) => handleContextMenu(e, dashboard)} onClick={() => handleEdit(dashboard.id)}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="caption" color="text.secondary"><strong>Descripción: </strong>{dashboard.description != "" ? dashboard.description : "Sin descripción"}</Typography>
                                                    <Typography variant="caption" color="text.secondary"><strong>Fecha de creación: </strong>{moment(dashboard.created_at).format("LLLL")}</Typography>
                                                    <Typography variant="caption" color="text.secondary"><strong>Fecha de modificación: </strong>{moment(dashboard.edited_at).format("LLLL")}</Typography>
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
            {viewMode === 'large-icons' && (
                <Card
                    key={dashboard.id}
                    sx={{
                        height: viewMode === "large-icons" ? "250px" : "180px",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Tooltip
                        title={renderTooltip(dashboard)}
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
                            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
                            onContextMenu={(e) => handleContextMenu(e, dashboard)}
                            onClick={() => handleEdit(dashboard.id)}
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
                                <DashboardIcon sx={{ fontSize: 50, color: 'primary.main' }} />
                            </Box>
                            <CardContent sx={{ p: 1, flex: "none", width: "100%", boxSizing: "border-box" }}>
                                <MarqueeText
                                    text={dashboard.name}
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
                                dashboard.is_published ? "Cambiar a solo es visible para mí" : "Habilitar visibilidad para todos"
                            }
                        >
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleChangeStates("is_published", dashboard)
                                }}
                            >
                                {dashboard.is_published ? (
                                    <CheckCircleRounded sx={{ color: "#a5a5a5", fontSize: "18px" }} />
                                ) : (
                                    <UnpublishedRounded sx={{ color: "#a5a5a5", fontSize: "18px" }} />
                                )}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={dashboard.is_public ? "Activar autorización" : "Desactivar autorización"}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleChangeStates("is_public", dashboard)
                                }}
                            >
                                {dashboard.is_public ? (
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
                                    handleContextMenu(e, dashboard, 20)
                                }}
                            >
                                {<MoreHorizRounded sx={{ color: "#a5a5a5", fontSize: "18px" }} />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Card>
            )}

            {selectedDashboard && (
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
                    <MenuItem onClick={() => handleEdit(selectedDashboard.id)}>
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

            <DeleteModal
                open={isDeleteModal}
                onClose={() => setIsDeleteModal(false)}
                user={props.user[0]}
                titleToDelete={selectedDashboard?.name}
                idToDelete={selectedDashboard?.id}
                entityType="dashboard"
                entityName="tablero"
                entityIdField="dashboard_id"
                onSuccess={getDashboardList}
                customTitle="Eliminación de tablero"
            />
            <Dialog open={isViewModal} onClose={() => setIsViewModal(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        maxWidth: '900px',
                        width: '100%',
                    }
                }}
            >
                <ViewDashboard
                    setIsViewModal={setIsViewModal}
                    viewDashboard={selectedDashboard}
                    dimensions={props.dimensions}
                />
            </Dialog>
        </>

    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        organization: state.organization,
        actions: state.actions,
        permissions: state.permissions,
    };
};

export default connect(mapStateToProps)(Dashboards); 
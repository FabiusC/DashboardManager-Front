/* 
Name: index
Action: index of Logs component
*/

import { connect } from 'react-redux';
import { useEffect, useState } from 'react';
import {
    Box,
    Tooltip,
    IconButton,
    Typography
} from '@mui/material';
import {
    allUserLogs
} from '../../services/creangelAuthAPI';
import { StyledMaterialTable_withoutActions } from '../Recursive/mui_styled_components';
import {
    validatorAPIBasicParameters,
    handleRequestErrorNotification
} from '../../source/validators';
import { useDispatch } from 'react-redux';
import Divider from '@mui/material/Divider';
//Icons
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import AuthAdapter from '../../adapters/authAdapter';


function LogsUser(props) {

    /*
    =======================================================
    ===============VARIABLES===============================
    =======================================================
    */
    const [logsList, setLogsList] = useState([]);
    const dispatch = useDispatch();
    const authAdapter = new AuthAdapter; 
    const verbose = false;
    const columns = [
        {
            accessorKey: '@timestamp',
            header: 'Fecha',
            size: 80,
            muiTableHeadCellProps: {
                align: 'center',
            },
            muiTableBodyCellProps: {
                align: 'center',
            },
            Cell: ({ cell }) => {
                return (
                    <Box component="span">
                        {cell.getValue('@timestamp').substring(0, 19)}
                    </Box>
                )
            }
        },
        {
            accessorKey: 'action',
            header: 'Acción',
            size: 80,
            muiTableHeadCellProps: {
                align: 'center',
            },
            muiTableBodyCellProps: {
                align: 'center',
            }
        },
        {
            accessorKey: 'group',
            header: 'Grupo',
            size: 80,
            muiTableHeadCellProps: {
                align: 'center',
            },
            muiTableBodyCellProps: {
                align: 'center',
            }
        },
        {
            accessorKey: 'object_type',
            header: 'Objeto',
            size: 80,
            muiTableHeadCellProps: {
                align: 'center',
            },
            muiTableBodyCellProps: {
                align: 'center',
            }
        },
        {
            accessorKey: 'result',
            header: 'Resultado',
            size: 80,
            muiTableHeadCellProps: {
                align: 'center',
            },
            muiTableBodyCellProps: {
                align: 'center',
            }
        },
    ]

    /*
    =======================================================
    ===============VERBOSE=================================
    =======================================================
    */

    if (verbose) { console.log("LogsUser01", props) }
    // if (verbose) { console.log("LogsUser02", tasksList) }

    /*
    =======================================================
    ===============USEEFFECTS==============================
    =======================================================
    */

    useEffect(() => {
        handlerRequestGetUserLogs();
    }, [])

    /*
    ==============================================================
    ===============CONTROL FUNCTIONS==============================
    ==============================================================
    */

    const handlerRequestGetUserLogs = async () => {
        let requestHeader = {
            'Authorization': 'Bearer ' + props.user[0].userID,
            'Content-Type': 'application/json'
        }
        let response__ = await allUserLogs(requestHeader);
        let userLogs = []; 
        if (authAdapter.checkLogsUserList(response__["data"])) {
            userLogs = authAdapter.adaptLogsUserList(response__["data"]); 
        }
        const [validResponse, responseContent] = validatorAPIBasicParameters(response__, props.user[0].userData, dispatch);
        if (verbose) { console.log("logs01", validResponse) }
        if (verbose) { console.log("logs02 user", responseContent) }
        handleRequestErrorNotification(validResponse, responseContent, dispatch,
            {
                "success": "La lista de logs ha sido actualizada con éxito.",
                "err": "No se pudo finalizar el proceso de listar los logs del usuario. Servicio no disponible.",
                "invalidResponse": "La respuesta del servidor para listar los logs del usuario no es válida."
            },
            {
                "success": (dat) => {
                    setLogsList(userLogs)
                },
                "err": () => {
                    setLogsList([])
                },
                "invalidResponse": () => {
                    setLogsList([])
                }
            },
            true
        )
    }

    /*
    ==============================================================
    ===============RENDER=========================================
    ==============================================================
    */

    return (
        <div className='fullWidht distributed_horz_strech flex_wrap gap_2_undetermine'>
            <div className='fullWidht bg_white box_shadow_aws'>
                <Box>
                    <Box className="pad_35">
                        <Typography variant="h5" noWrap className='color_body_titles' component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                            <span>{"Logs asociados"}</span>
                        </Typography>
                        <Divider />
                        {logsList.length == 0 &&
                            <Box className="fullWidht mt_20">
                                <StyledMaterialTable_withoutActions
                                    isLoading={true}
                                    columns={[]}
                                    data={[]}
                                    muiTableContainerProps={{
                                        sx: {
                                            minHeight: '400px',
                                            maxHeight: '800px',
                                            fontFamily: 'Roboto',
                                            '& .MuiTableSortLabel-icon': { color: "#ffffff !important" },
                                            '& .MuiIconButton-root': { color: "unset !important" },
                                            maxWidth: "100%",
                                        }
                                    }}
                                    renderTopToolbarCustomActions={({ table }) => (
                                        <Tooltip title={"Refrescar"} placement="top" arrow>
                                            <IconButton
                                                variant="contained"
                                                onClick={() => { handlerRequestGetTasks() }}
                                            >
                                                <AutorenewRoundedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                />
                            </Box>
                        }
                        {logsList.length != 0 &&
                            <Box className="fullWidht mt_20">
                                <StyledMaterialTable_withoutActions
                                    columns={columns}
                                    data={logsList}
                                    muiTableContainerProps={{
                                        sx: {
                                            minHeight: '400px',
                                            maxHeight: '800px',
                                            fontFamily: 'Roboto',
                                            '& .MuiTableSortLabel-icon': { color: "#ffffff !important" },
                                            '& .MuiIconButton-root': { color: "unset !important" },
                                            maxWidth: "100%",
                                        }
                                    }}
                                    enableExpandAll={false}
                                    renderTopToolbarCustomActions={({ table }) => (
                                        <Tooltip title={"Refrescar"} placement="top" arrow>
                                            <IconButton
                                                variant="contained"
                                                onClick={() => { handlerRequestGetUserLogs() }}
                                            >
                                                <AutorenewRoundedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                />
                            </Box>
                        }
                    </Box >
                </Box>
            </div>
        </div >
    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        organization: state.organization,
        actions: state.actions,
        dimensions: state.dimensions
    };
};

export default connect(mapStateToProps)(LogsUser);
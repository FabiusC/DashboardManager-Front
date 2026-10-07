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
    Typography,
    Menu,
    MenuItem,
    ListItemText
} from '@mui/material';
import {
    customLogs,
    facetLogs
} from '../../services/creangelAuthAPI';
import { columnsLogsList,
         columnsHistoricalLogsList
} from './ColumnsLogs';
import { StyledMaterialTable_withoutActions_compact, StyledChip } from '../Recursive/mui_styled_components';
import {
    validatorAPIBasicParameters,
    handleRequestErrorNotification
} from '../../source/validators';
// import {handleDownloadReport} from './ExportReport';
import { useDispatch } from 'react-redux';
import Divider from '@mui/material/Divider';
import { BarChart } from '@mui/x-charts/BarChart';
//Icons
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TodayIcon from '@mui/icons-material/Today';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import CheckIcon from '@mui/icons-material/Check';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const verbose = false;

function LogsAdmin(props) {

    /*
    =======================================================
    ===============VARIABLES===============================
    =======================================================
    */
   const [isLoadignFacetLogs, setIsLoadingFacetLogs] = useState(true);
   const [     dataFacetLogs,      setDataFacetLogs] = useState({"year":[],
                                                                 "month":[],
                                                                 "day_week":[],
                                                                 "day":[],
                                                                 "hour":[],
                                                                 "groups": [],
                                                                 "users": [],
                                                                 "object_types": [],
                                                                 "actions": [],
                                                                 "status": []
   })
   const [           filters,            setFilters] = useState({"year": null,
                                                                 "month": null,
                                                                 "day_week": null,
                                                                 "day": null,
                                                                 "hour": null,
                                                                 "groups": null,
                                                                 "users": null,
                                                                 "object_types": null,
                                                                 "actions": null,
                                                                 "status":null
   })

    const [            logsList,             setLogsList] = useState([]);
    const [isLoadingHistoryLogs, setIsLoadingHistoryLogs] = useState(true);
    const iconsFilters = {
        "year": <CalendarTodayIcon />,
        "month": <CalendarMonthIcon />,
        "day_week": <DateRangeIcon />,
        "day": <TodayIcon />,
        "hour": <QueryBuilderIcon />,
        "groups": <GroupRoundedIcon />,
        "users": <PersonOutlineIcon />,
        "object_types": <ViewInArIcon />,
        "actions": <DirectionsRunIcon />,
        "status": <CheckIcon />
    }
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };
    const availableKeyFilter = ["year", "month", "day_week", "day", "hour", "groups", "users", "object_types", "actions", "status"];
    const firstRowPanels     = ["year", "month", "day_week"];
    const secondRowPanels    = ["day", "hour"];
    const thirdRowPanels     = ["groups", "users", "object_types"];
    const fourthRowRowPanels = ["actions", "status"];

    const dispatch = useDispatch();
    const [windowSize, setWindowSize] = useState(props?.dimensions?.width);

    /*
    =======================================================
    ===============VERBOSE=================================
    =======================================================
    */

    if (verbose) {
        console.log("LogsUser01", props)
        console.log("## open ", open)
        console.log("## anchorEl ", anchorEl)
        console.log("## columnsLogsList ", columnsLogsList)
        console.log("## dataFacetLogs ", dataFacetLogs)
        console.log("## filters ", filters)
    }

    /*
    =======================================================
    ===============USEEFFECTS==============================
    =======================================================
    */

    useEffect(() => {
        handlerRequestFacetLogs();
        handlerRequestGetUserLogs();
    }, [])

    useEffect(() => {
        handlerRequestFacetLogs();
        handlerRequestGetUserLogs();
    }, [filters])

    /*
    ==============================================================
    ===============CONTROL FUNCTIONS==============================
    ==============================================================
    */

    const handlerRequestFacetLogs = async () => {
        setIsLoadingFacetLogs(true)
        let requestHeader = {
            'Authorization': 'Bearer ' + props.user[0].userID,
            'Content-Type': 'application/json'
        }
        let requestBody = {
            "organization_id": props.organization[0].id,
            "application": null,
            "object_type": filters["object_types"],
            "year": filters["year"],
            "month": filters["month"],
            "day_week": filters["day_week"],
            "day": filters["day"],
            "hour": filters["hour"],
            "status": filters["status"],
            "action": filters["actions"],
            "group": filters["groups"],
            "user": filters["users"]
        }
        let response__ = await facetLogs(requestBody, requestHeader);
        const [validResponse, responseContent] = validatorAPIBasicParameters(response__, props.user[0].userData, dispatch);
        handleRequestErrorNotification(validResponse, responseContent, dispatch,
            {
                "success": "La lista de acciones ha sido actualizada con éxito.",
                "err": "No se pudo finalizar el proceso de listar las acciones. Servicio no disponible.",
                "invalidResponse": "La respuesta del servidor para listar las acciones no es válida."
            },
            {
                "success": (dat) => {
                    setDataFacetLogs(dat)
                    setIsLoadingFacetLogs(false)
                },
                "err": () => {
                    setDataFacetLogs({})
                    setIsLoadingFacetLogs(false)
                },
                "invalidResponse": () => {
                    setDataFacetLogs({})
                    setIsLoadingFacetLogs(false)
                }
            },
        )
    }

    const handlerRequestGetUserLogs = async () => {
        setIsLoadingHistoryLogs(true)
        let requestHeader = {
            'Authorization': 'Bearer ' + props.user[0].userID,
            'Content-Type': 'application/json'
        }
        let requestBody = {
            "application": null,
            "object_type": filters["object_types"],
            "year": filters["year"],
            "month": filters["month"],
            "day_week": filters["day_week"],
            "day": filters["day"],
            "hour": filters["hour"],
            "status": filters["status"],
            "action": filters["actions"],
            "limit": 5000,
            "group": filters["groups"],
            "user": filters["users"]
        }
        let response__ = await customLogs(requestBody, requestHeader);
        const [validResponse, responseContent] = validatorAPIBasicParameters(response__, props.user[0].userData, dispatch);
        if (verbose) { console.log("logs01", validResponse) }
        if (verbose) { console.log("logs02", responseContent) }
        handleRequestErrorNotification(validResponse, responseContent, dispatch,
            {
                "success": "La lista de logs ha sido actualizada con éxito.",
                "err": "No se pudo finalizar el proceso de listar los logs del usuario. Servicio no disponible.",
                "invalidResponse": "La respuesta del servidor para listar los logs del usuario no es válida."
            },
            {
                "success": (dat) => {
                    setLogsList(dat)
                    setIsLoadingHistoryLogs(false)
                },
                "err": () => {
                    setLogsList([])
                    setIsLoadingHistoryLogs(false)
                },
                "invalidResponse": () => {
                    setLogsList([])
                    setIsLoadingHistoryLogs(false)
                }
            },
        )
    }

    const handlerRequestSyncLogs = () => {
        handlerRequestGetUserLogs();
        handlerRequestFacetLogs();
    }

    const handlerAddFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const handlerRemoveFilters = (keyFilter) => {
        setFilters(prev => ({ ...prev, [keyFilter]: null }))
        handlerRequestGetUserLogs();
        handlerRequestFacetLogs();
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
                        <Box className="distributed_horz">
                            <Typography variant="h5" noWrap className='color_body_titles' component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                                <span>{"Administración de logs"}</span>
                            </Typography>
                            <Box className="distributed_vert">
                                <Box>
                                    <Tooltip title={"Descargar reporte de actividad"} placement="top" arrow>
                                        <IconButton
                                            variant="contained"
                                            onClick={(event) => { handleClick(event) }}
                                            aria-controls={open ? 'account-menu' : undefined}
                                            aria-haspopup="true"
                                            aria-expanded={open ? 'true' : undefined}
                                            size="large"
                                        >
                                        <DownloadIcon sx={{ 
                                            color: '#8486A2',
                                            border: '2px solid #8486A2',
                                            borderRadius: '50%',
                                            backgroundColor: 'lightgrey',
                                            fontSize: '2rem',
                                            width: '2.1rem',
                                            height: '2.1rem'
                                        }}/>
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <Menu
                                    anchorEl={anchorEl}
                                    id="account-menu"
                                    open={open}
                                    onClose={handleClose}
                                    onClick={handleClose}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                    sx={{
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                        mt: 1.5,
                                        '& .MuiAvatar-root': {
                                          width: 32,
                                          height: 32,
                                          ml: -0.5,
                                          mr: 1,
                                        },
                                        '&::before': {
                                          content: '""',
                                          display: 'block',
                                          position: 'absolute',
                                          top: 0,
                                          right: 14,
                                          width: 10,
                                          height: 10,
                                          bgcolor: 'background.paper',
                                          transform: 'translateY(-50%) rotate(45deg)',
                                          zIndex: 0,
                                        },
                                    }}
                                >
                                    {/* <MenuItem onClick={(event) =>{ handleDownloadReport("CSV", props.user[0].userData.username, props.user[0].userData.email, dataFacetLogs, logsList) }} sx={{ mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <InsertDriveFileIcon sx={{ color: 'grey' }}/>
                                            <ListItemText>CSV</ListItemText>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem onClick={(event) =>{ handleDownloadReport("PDF", props.user[0].userData.username, props.user[0].userData.email, dataFacetLogs, logsList) }} sx={{ mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <PictureAsPdfIcon sx={{ color: 'grey' }} />
                                            <ListItemText>PDF</ListItemText>
                                        </Box>
                                    </MenuItem> */}
                                </Menu>
                            </Box>
                        </Box>
                        <Divider />
                        <Box className="fullWidht mt_5 left_horz">
                            <Box>
                                <Tooltip title={"Refrescar"} placement="top" arrow>
                                    <IconButton
                                        variant="contained"
                                        onClick={() => { handlerRequestSyncLogs() }}
                                    >
                                        <AutorenewRoundedIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Box className="mt_5 left_horz gap_5px">
                                {availableKeyFilter.map((keyFilter_i) => {
                                    if (filters[keyFilter_i] != "" && filters[keyFilter_i] != null) {
                                        let showedValue = String(filters[keyFilter_i])
                                        return (
                                            <Tooltip title={filters[keyFilter_i]} placement="top" arrow>
                                                <Box className="gap_4px">
                                                    <StyledChip
                                                        icon={iconsFilters[keyFilter_i]}
                                                        label={showedValue.length > 9 ? showedValue.substring(0, 9) + "..." : showedValue}
                                                        onDelete={() => { handlerRemoveFilters(keyFilter_i) }}
                                                    >
                                                    </StyledChip>
                                                </Box>
                                            </Tooltip>
                                        )
                                    }
                                })}
                            </Box>
                        </Box>
                        <Box className="fullWidht mt_5 distributed_horz">
                            {firstRowPanels.map((key) => (
                                <Box className="w_32">
                                    <StyledMaterialTable_withoutActions_compact
                                        columns={columnsLogsList[key]}
                                        data={dataFacetLogs[key]}
                                        state={{ isLoading: isLoadignFacetLogs }}
                                        muiTableContainerProps={{
                                            sx: {
                                                minHeight: '150px',
                                                maxHeight: '150px',
                                                fontFamily: 'Roboto',
                                                '& .MuiTableSortLabel-icon': { color: "#ffffff !important" },
                                                '& .MuiIconButton-root': { color: "unset !important" },
                                                position: "sticky"
                                            }
                                        }}
                                        enableExpandAll={false}
                                        muiTableBodyRowProps={({ row }) => ({
                                            onClick: (event) => {
                                                handlerAddFilter(key, row.original.field)
                                            },
                                            sx: {
                                                cursor: 'pointer',
                                            },
                                        })}
                                    />
                                </Box>
                            ))}
                            <BarChart
                                xAxis={[{ scaleType: 'band', data: ['group A', 'group B', 'group C'] }]}
                                series={[{ data: [4, 3, 5] }, { data: [1, 6, 3] }, { data: [2, 5, 6] }]}
                                width={500}
                                height={300}
                            />
                        </Box>
                        <Box className="fullWidht mt_5 distributed_horz">
                            {secondRowPanels.map((key) => (
                                <Box className="w_49">
                                    <StyledMaterialTable_withoutActions_compact
                                        columns={columnsLogsList[key]}
                                        data={dataFacetLogs[key]}
                                        state={{ isLoading: isLoadignFacetLogs }}
                                        muiTableContainerProps={{
                                            sx: {
                                                minHeight: '150px',
                                                maxHeight: '150px',
                                                fontFamily: 'Roboto',
                                                '& .MuiTableSortLabel-icon': { color: "#ffffff !important" },
                                                '& .MuiIconButton-root': { color: "unset !important" },
                                                position: "sticky"
                                            }
                                        }}
                                        enableExpandAll={false}
                                        muiTableBodyRowProps={({ row }) => ({
                                            onClick: (event) => {
                                                handlerAddFilter(key, row.original.field)
                                            },
                                            sx: {
                                                cursor: 'pointer',
                                            },
                                        })}
                                    />
                                </Box>
                            ))}
                        </Box>
                        <Box className="fullWidht mt_5 distributed_horz">
                            {thirdRowPanels.map((key) => (
                                <Box className="w_32">
                                    <StyledMaterialTable_withoutActions_compact
                                        columns={columnsLogsList[key]}
                                        data={dataFacetLogs[key]}
                                        state={{ isLoading: isLoadignFacetLogs }}
                                        muiTableContainerProps={{
                                            sx: {
                                                minHeight: '150px',
                                                maxHeight: '150px',
                                                fontFamily: 'Roboto',
                                                '& .MuiTableSortLabel-icon': { color: "#ffffff !important" },
                                                '& .MuiIconButton-root': { color: "unset !important" },
                                                position: "sticky"
                                            }
                                        }}
                                        enableExpandAll={false}
                                        muiTableBodyRowProps={({ row }) => ({
                                            onClick: (event) => {
                                                handlerAddFilter(key, row.original.field)
                                            },
                                            sx: {
                                                cursor: 'pointer',
                                            },
                                        })}
                                    />
                                </Box>
                            ))}
                        </Box>
                        <Box className="fullWidht mt_5 distributed_horz">
                            {fourthRowRowPanels.map((key) => (
                                <Box className="w_49">
                                    <StyledMaterialTable_withoutActions_compact
                                        columns={columnsLogsList[key]}
                                        data={dataFacetLogs[key]}
                                        state={{ isLoading: isLoadignFacetLogs }}
                                        muiTableContainerProps={{
                                            sx: {
                                                minHeight: '150px',
                                                maxHeight: '150px',
                                                fontFamily: 'Roboto',
                                                '& .MuiTableSortLabel-icon': { color: "#ffffff !important" },
                                                '& .MuiIconButton-root': { color: "unset !important" },
                                                position: "sticky"
                                            }
                                        }}
                                        enableExpandAll={false}
                                        muiTableBodyRowProps={({ row }) => ({
                                            onClick: (event) => {
                                                handlerAddFilter(key, row.original.field)
                                            },
                                            sx: {
                                                cursor: 'pointer',
                                            },
                                        })}
                                    />
                                </Box>
                            ))}
                        </Box>
                        <Box className="mt_5">
                            <StyledMaterialTable_withoutActions_compact
                                columns={columnsHistoricalLogsList}
                                data={logsList}
                                state={{ isLoading: isLoadingHistoryLogs }}
                                muiTableContainerProps={{
                                    sx: {
                                        minHeight: '300px',
                                        maxHeight: '300px',
                                        fontFamily: 'Roboto',
                                        '& .MuiTableSortLabel-icon': { color: "#ffffff !important" },
                                        '& .MuiIconButton-root': { color: "unset !important" },
                                        width: (windowSize == undefined ? 1000 : windowSize - 220).toString() + "px",
                                    }
                                }}
                                enableExpandAll={false}
                            />
                        </Box>
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

export default connect(mapStateToProps)(LogsAdmin);

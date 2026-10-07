import _ from "lodash";
import { useState, useEffect } from 'react';
import { pushNotification } from "../../../redux/actions";
import { useDispatch } from 'react-redux';
import {
    Box,
    Tooltip,
    Typography,
    Grid,
    Divider,
    IconButton,
    Paper
} from '@mui/material';
//Icons
import {
    Close,
    Star,
    DateRange,
    DescriptionRounded,
    InsertInvitationRounded,
    LockRounded,
    PublicRounded,
    TitleRounded,
    PieChart
} from "@mui/icons-material";

const ViewPanel = (props) => {
    const [panelForm, setPanelForm] = useState([
        { id: "title", title: "Título", info: "Título del panel", placeholder: "", value: "", component: "input", type: "text", icon: <TitleRounded sx={{ color: 'primary.main' }} /> },
        { id: "description", title: "Descripción", info: "Descripción del panel", placeholder: "", value: "", component: "input", type: "text", icon: <DescriptionRounded sx={{ color: 'primary.main' }} /> },
        { id: "created_at", title: "Fecha de creación", info: "Fecha de creación del panel", placeholder: "", value: "", component: "input", type: "text", icon: <DateRange sx={{ color: 'primary.main' }} /> },
        { id: "edited_at", title: "Última edición", info: "Fecha de la ultima edición del panel", placeholder: "", value: "", component: "input", type: "text", icon: <InsertInvitationRounded sx={{ color: 'primary.main' }} /> },
        { id: "is_public", title: "Estado de la autorización", info: "Si la autorización está activada, el panel requiere autorización para ser accedido.", placeholder: "", value: "", component: "input", type: "bool", icon: <PublicRounded sx={{ color: 'primary.main' }} /> },
        { id: "is_published", title: "Visibilidad en la organización", info: "Si el panel está publicado, el panel es accesible a cualquier usuario para crear tableros, dentro de los grupos admitidos en la organización.", placeholder: "", value: "", component: "input", type: "bool", icon: <LockRounded sx={{ color: 'primary.main' }} /> }
    ]);
    const [panelHeight, setPanelHeight] = useState(0);
    const dispatch = useDispatch();

    useEffect(() => {
        if (props.viewPanel != undefined && Object.keys(props.viewPanel).length > 0) {
            setPanelForm((prev) => {
                let deepCopyPrev = _.cloneDeep(prev)
                deepCopyPrev.map((eachOne) => {
                    eachOne.value = props.viewPanel[eachOne.id]
                    if (eachOne.id == "created_at" || eachOne.id == "edited_at") {
                        const date = new Date(props.viewPanel[eachOne.id])
                        eachOne.value = date.toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })
                    }
                    if (eachOne.id == "is_public") {
                        eachOne.value = String(props.viewPanel[eachOne.id]) === "true" ? "Desactivada" : "Activada"
                    }
                    if (eachOne.id == "is_published") {
                        eachOne.value = String(props.viewPanel[eachOne.id]) === "true" ? "Visible para todos los usuarios en la organización" : "Visible sólo para mi"
                    }
                })
                return deepCopyPrev
            })
        } else {
            dispatch(pushNotification({ "msg": "Servicio no disponible", "status": "err" }));
        }
    }, [props.viewPanel])

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
                onClick={() => props.setIsViewModal(false)}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    padding: '6px',
                    backgroundColor: '#f0f0f0',
                    '&:hover': { backgroundColor: '#e0e0e0' },
                }}
            >
                <Close />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: "500", marginBottom: "10px", display: 'flex', alignItems: 'center' }}>
                Detalles del Panel
            </Typography>
            <Box className={props?.dimensions?.width < 900 ? "center_vert fullWidth gap_10px" : "left_horz fullWidth gap_20px"}>
                <Box className={props?.dimensions?.width < 900 ? "fullWidth" : "w_40"} sx={{ backgroundColor: theme => theme.palette.secondary.main }}>
                    {/* AINV: esto es temporal, se debe cambiar por el renderizado del panel */}
                    <Box
                        sx={{
                            borderRadius: '3px',
                            display: 'flex',
                            flexDirection: props?.dimensions?.width < 900 ? 'row' : 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: props?.dimensions?.width < 900 ? "unset" : "500px",
                            minWidth: props?.dimensions?.width < 900 ? "100px" : "unset"
                        }}
                    >
                        <PieChart sx={{ fontSize: 64, color: 'primary.main' }} />
                    </Box>
                </Box>
                <Box className={props?.dimensions?.width < 900 ? "fullWidth" : "w_60"}>
                    {panelForm.map((info) => (
                        <Paper key={info.id} sx={{ padding: 2, marginBottom: 1, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ marginRight: 2 }}>
                                <Tooltip title={info.info} placement="top">
                                    {info.icon}
                                </Tooltip>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {info.title}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <Typography variant="body1">
                                        {info.value == "" ? "Sin información" : info.value}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Box>
            </Box>
        </Box>

    );
};

export default ViewPanel;
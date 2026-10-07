/* 
Name: ViewProject
Action: view project's information
*/

import _ from "lodash";
import { useState, useEffect } from 'react';
import { pushNotification } from '@redux/actions';
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
import { Close, Info, Star, Start } from "@mui/icons-material";

const ViewProject = (props) => {

    /*
    =======================================================
    ===============VARIABLES===============================
    =======================================================
    */

    const verbose = false;
    const [projectForm, setProjectForm] = useState([
        { id: "created_at", title: "Fecha de creación", info: "Fecha de creación del proyecto", placeholder: "", value: "", component: "input", type: "text" },
        { id: "edited_at", title: "Última edición", info: "Fecha de la ultima edición del proyecto", placeholder: "", value: "", component: "input", type: "text" },
        { id: "description", title: "Descripción", info: "Descripción del proyecto", placeholder: "Ingrese el tipo de licencia", value: "", component: "input", type: "text" },
    ]);
    const dispatch = useDispatch();

    /*
    =======================================================
    ===============VERBOSE=================================
    =======================================================
    */

    if (verbose) { console.log("ModalViewService2", props) }
    if (verbose) { console.log("ModalViewService2", projectForm) }
    console.log("props.viewProject", props.viewProject)
    /*
    =======================================================
    ===============USEEFFECTS==============================
    =======================================================
    */

    useEffect(() => {

        if (props.viewProject != undefined && Object.keys(props.viewProject).length > 0) {
            setProjectForm((prev) => {
                let deepCopyPrev = _.cloneDeep(prev)
                deepCopyPrev.map((eachOne) => {
                    eachOne.value = props.viewProject[eachOne.id]
                    if (eachOne.id == "created_at" || eachOne.id == "edited_at") {
                        const date = new Date(props.viewProject[eachOne.id])
                        eachOne.value = date.toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })
                    }
                })
                return deepCopyPrev
            })
        } else {
            dispatch(pushNotification({ "msg": "Servicio no disponible", "status": "err" }));
        }
    }, [props.viewProject])


    /*
    ==============================================================
    ===============RENDER=========================================
    ==============================================================
    */

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
            <Typography variant="h6" noWrap  component="div" sx={{ fontWeight: "500", marginBottom: "10px", display: 'flex', alignItems: 'center' }}>
                Visualización del Proyecto
                { props.viewProject.favorite && <Star sx={{ color: '#ffe854'}} /> }
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />
            <Box>
                {projectForm.map((info) => (
                    <Paper key={info.id} sx={{ padding: 2, marginBottom: 1, display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ marginRight: 2 }}>
                            <Tooltip title={info.info} placement="top">
                                <Info sx={{ color: 'primary.main' }} />
                            </Tooltip>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4} sx={{display: 'flex', alignItems: 'center'}}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {info.title}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <Typography variant="body1">
                                    {info.value}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                ))}
            </Box>
        </Box>

    )
}

export default ViewProject;
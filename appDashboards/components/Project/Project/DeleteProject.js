import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { StyledButton } from '@components/Recursive/mui_styled_components';
import {
    Box,
    CircularProgress,
    TextField,
} from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { pushNotification } from "@redux/actions";
import { deleteProject as deleteProjectService } from "@services/creangelAuthAPI";


const DeleteProject = (props) => {
    const verbose = false;
    const [projectName, setProjectName] = useState('');
    const [projectIndex, setProjectIndex] = useState(null)
    const [verifyGroup, setVerifyGroup] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(false);
    const dispatch = useDispatch();
    // console.log("props.projectDelete", props.projectDelete)
    // console.log("isLoadingData", isLoadingData)

    /*
    =======================================================
    ===============VERBOSE=================================
    =======================================================
    */

    if (verbose) { console.log("ModalDeleteUser0", props) }
    if (verbose) { console.log("ModalDeleteUser1", projectName) }

    /*
    =======================================================
    ===============USEEFFECTS==============================
    =======================================================
    */

    useEffect(() => {
        if (props.projectDelete != undefined && Object.keys(props.projectDelete).length > 0) {
            setProjectName(props.projectDelete?.name || '')
            setProjectIndex(props.projectDelete?.project_id ?? null)
        } else {
            setProjectName('')
            setProjectIndex(null)
            dispatch(pushNotification({ "msg": "Servicio no disponible", "status": "err" }));
        }
    }, [JSON.stringify(props.projectDelete)])

    /*
    ==============================================================
    ===============CONTROL FUNCTIONS==============================
    ==============================================================
    */
    const handleChangeText = (e) => {
        setVerifyGroup(e.target.value)
    }

    const isButtonEnabled = projectName?.trim() !== '' && verifyGroup?.trim() === projectName;

    const deleteProjectAPI = async () => {
        try {
            setIsLoadingData(true)
            const response = await deleteProjectService(projectIndex, {
                'Authorization': `Bearer ${props.user.userID}`
            });
            if (response.status === "ok") {
                setTimeout(() => {
                    setIsLoadingData(false)
                    props.handleProject()
                    props.setIsDeleteModal(false)
                }, 1500);
            } else {
                dispatch(pushNotification({ msg: "Error al eliminar el proyecto , debe eliminar las carpetas asociadas al proyecto", status: 'err' }));
                setIsLoadingData(false);
                props.setIsDeleteModal(false)
            }
        } catch (error) {
            setIsLoadingData(false)
            dispatch(pushNotification({ msg: "Error inesperado al eliminar el proyecto", status: 'err' }));
        }
    }

    return (    
        <Box className="pad_35">
            <Typography variant="h6" noWrap  component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                Eliminación de Proyectos
            </Typography>
            <Divider />
            <Box>
                <Box className="pad_20">
                    {
                        <Box className="pad_40 bg_white_op_245">
                            <Typography component="div" className="bg_body_titles center_horz_2" sx={{ textAlign: "center", fontWeight: "500", marginBottom: "10px", fontSize: "20px" }}>
                                <WarningRoundedIcon fontSize="medium" className="pad_r_5 center_vert" color="warning" />
                                Advertencia
                            </Typography>
                            <Typography component="div" sx={{ textAlign: "justify", fontWeight: "500", marginBottom: "10px", fontSize: "16px" }}>
                                La acción que desea realizar no se puede revertir. Confirmar esta acción implica la eliminación de todas las relaciones asociadas al proyecto 
                                <strong> {projectName}.</strong>
                            </Typography>
                            <Typography component="div" sx={{ textAlign: "justify", fontWeight: "500", marginBottom: "10px", fontSize: "16px" }}>
                                Para confirmar la eliminación por favor ingresar el nombre del proyecto a continuación: 
                            </Typography>
                            <Box className="center_horz gap_2_undetermine">                                    
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    type="text"
                                    placeholder="Ingrese el nombre del proyecto"
                                    onChange={(e) => { handleChangeText(e) }}
                                    value={verifyGroup}
                                    autoComplete="off"
                                    
                                />                                    
                            </Box> 
                            <Typography component="div" sx={{ textAlign: "center", fontWeight: "500", marginTop: "20px", fontSize: "16px" }}>
                                Presione <strong>'Confirmar'</strong> para continuar, de lo contrario presione <strong>'Cancelar'</strong>.
                            </Typography>
                        </Box>
                    }
                </Box>
                <Box className="center_horz gap_10_undetermine">
                    <StyledButton
                        variant="contained"
                        onClick={() => { props.setIsDeleteModal(false) }}
                    >
                        Cancelar                            
                    </StyledButton>
                    <StyledButton
                        variant="contained"
                        disabled={!isButtonEnabled || isLoadingData}
                        onClick={deleteProjectAPI}
                        endIcon={isLoadingData ? <CircularProgress size={20}/> : null}
                    >
                        {isLoadingData ? 'Eliminando...' : 'Continuar'}
                    </StyledButton>
                </Box>
            </Box>
        </Box>
    )
}

export default DeleteProject
import _ from "lodash";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { StyledButton } from '../../Recursive/mui_styled_components';
import {
    Box,
    CircularProgress,
    TextField,
} from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { pushNotification } from "../../../redux/actions";
import { deleteFolder as deleteFolderService } from "../../../services/creangelAuthAPI";


const DeleteFolder = ({ folderDelete, setIsDeleteModal, handleFolder, user }) => {

    const verbose = false
    const [folderName, setFolderName] = useState();
    const [folderIndex, setFolderIndex] = useState()
    const [verifyGroup, setVerifyGroup] = useState();
    const [isLoadingData, setIsLoadingData] = useState(false);
    const dispatch = useDispatch();

    /*
    =======================================================
    ===============VERBOSE=================================
    =======================================================
    */

    if (verbose) { console.log("ModalDeleteUser0") }
    if (verbose) { console.log("ModalDeleteUser1", folderName) }

    /*
    =======================================================
    ===============USEEFFECTS==============================
    =======================================================
    */

    useEffect(() => {
        
        if (folderDelete != undefined && Object.keys(folderDelete).length > 0) {
            setFolderName(folderDelete?.name)
            setFolderIndex(folderDelete?.folder_id)
        } else {
            dispatch(pushNotification({ "msg": "Servicio no disponible", "status": "err" }));
        }
    }, [])

    /*
    ==============================================================
    ===============CONTROL FUNCTIONS==============================
    ==============================================================
    */
    const handleChangeText = (e) => {
        setVerifyGroup(e.target.value)
    }

    const deleteFolder = async () => {
        setIsLoadingData(true)
        const response = await deleteFolderService(folderIndex, {
            'Authorization': `Bearer ${user.userID}`
        });
        if (response.status === "ok") {
            setTimeout(() => {
                dispatch(pushNotification({ msg: "Carpeta eliminada correctamente", status: 'ok' }));
                handleFolder(); 
                setIsDeleteModal(false); 
                setIsLoadingData(false); 
            }, 1500); 
        } else {
            dispatch(pushNotification({ msg: response.msg, status: 'err' }));
            setIsLoadingData(false); 
        }
    }

    const isButtonEnabled = verifyGroup === folderName;

    return (
        <Box className="pad_35">
            <Typography variant="h6" noWrap  component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                Eliminación de carpeta
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
                                La acción que desea realizar no se puede revertir. Confirmar esta acción implica la eliminación de todas las relaciones asociadas a la carpeta 
                                <strong> {folderName}.</strong>
                            </Typography>
                            <Typography component="div" sx={{ textAlign: "justify", fontWeight: "500", marginBottom: "10px", fontSize: "16px" }}>
                                Para confirmar la eliminación por favor ingresar el nombre de la carpeta a continuación: 
                            </Typography>
                            <Box className="center_horz gap_2_undetermine">                                    
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    type="text"
                                    placeholder="Ingrese el nombre de la carpeta"
                                    onChange={(e) => { handleChangeText(e) }}
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
                        onClick={() => { setIsDeleteModal(false) }}
                    >
                        Cancelar                            
                    </StyledButton>
                    <StyledButton
                        variant="contained"
                        disabled={!isButtonEnabled || isLoadingData}
                        onClick={deleteFolder}
                        loading
                        loadingPosition="end"
                        endIcon={isLoadingData ? <CircularProgress size={20}/> : null}
                    >
                        {isLoadingData ? 'Eliminando...' : 'Continuar'}
                    </StyledButton>
                </Box>
            </Box>
        </Box>
    )
}

export default DeleteFolder
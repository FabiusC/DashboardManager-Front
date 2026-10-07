import _ from "lodash";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import { StyledButton } from './mui_styled_components';
import {
    Box,
    CircularProgress,
    TextField,
} from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { pushNotification } from "../../redux/actions";
import { deleteRequest } from "../../helpers/dashboardAPI/genericRequest";

const DeleteModal = ({ 
    open, 
    onClose, 
    user, 
    titleToDelete, 
    idToDelete, 
    entityType = 'panel',
    entityName = 'panel',
    entityIdField = 'panel_id',
    onSuccess,
    onError,
    customWarningMessage,
    customConfirmationMessage,
    customTitle = "Eliminación"
}) => {

    const [itemTitle, setItemTitle] = useState();
    const [itemIndex, setItemIndex] = useState();
    const [verifyTitle, setVerifyTitle] = useState();
    const [isLoadingData, setIsLoadingData] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (idToDelete != undefined) {
            setItemTitle(titleToDelete);
            setItemIndex(idToDelete);
        }
    }, [idToDelete, titleToDelete]);

    const handleChangeText = (e) => {
        setVerifyTitle(e.target.value);
    };

    const handleDelete = async () => {
        setIsLoadingData(true);
        const id = { id: itemIndex };
        
        try {
            const response = await deleteRequest(dispatch, user.userID, entityType, entityName, entityIdField, id);
            if (response[0]) {
                setTimeout(() => {
                    if (onSuccess) {
                        onSuccess();
                    }
                    handleClose();
                    setIsLoadingData(false);
                }, 1500);
            } else {
                setIsLoadingData(false);
                if (onError) {
                    onError();
                }
            }
        } catch (error) {
            setIsLoadingData(false);
            if (onError) {
                onError();
            }
        }
    };

    const handleClose = () => {
        setVerifyTitle('');
        onClose();
    };

    const isButtonEnabled = verifyTitle === itemTitle;
    
    const defaultWarningMessage = `La acción que desea realizar no se puede revertir. Confirmar esta acción implica la eliminación de todas las relaciones asociadas al ${entityName} <strong>${itemTitle}</strong>.`;
    
    const defaultConfirmationMessage = `Para confirmar la eliminación por favor ingresar el título del ${entityName} a continuación:`;

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minWidth: 400
                }
            }}
        >
            <Box className="pad_35">
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                    {customTitle}
                </Typography>
                <Divider />
                <Box>
                    <Box className="pad_20">
                        <Box className="pad_40 bg_white_op_245">
                            <Typography 
                                component="div" 
                                className="bg_body_titles center_horz_2" 
                                sx={{ textAlign: "center", fontWeight: "500", marginBottom: "10px", fontSize: "20px" }}
                            >
                                <WarningRoundedIcon fontSize="medium" className="pad_r_5 center_vert" color="warning" />
                                Advertencia
                            </Typography>
                            <Typography 
                                component="div" 
                                sx={{ textAlign: "justify", fontWeight: "500", marginBottom: "10px", fontSize: "16px" }}
                                dangerouslySetInnerHTML={{ 
                                    __html: customWarningMessage || defaultWarningMessage 
                                }}
                            />
                            <Typography 
                                component="div" 
                                sx={{ textAlign: "justify", fontWeight: "500", marginBottom: "10px", fontSize: "16px" }}
                            >
                                {customConfirmationMessage || defaultConfirmationMessage}
                            </Typography>
                            <Box className="center_horz gap_2_undetermine">                                    
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    type="text"
                                    placeholder={`Ingrese el título del ${entityName}`}
                                    onChange={handleChangeText}
                                    autoComplete="off"
                                    value={verifyTitle || ''}
                                />                                    
                            </Box> 
                            <Typography 
                                component="div" 
                                sx={{ textAlign: "center", fontWeight: "500", marginTop: "20px", fontSize: "16px" }}
                            >
                                Presione <strong>'Confirmar'</strong> para continuar, de lo contrario presione <strong>'Cancelar'</strong>.
                            </Typography>
                        </Box>
                    </Box>
                    <Box className="center_horz gap_10_undetermine">
                        <StyledButton
                            variant="contained"
                            onClick={handleClose}
                            disabled={isLoadingData}
                        >
                            Cancelar                            
                        </StyledButton>
                        <StyledButton
                            variant="contained"
                            disabled={!isButtonEnabled || isLoadingData}
                            onClick={handleDelete}
                            endIcon={isLoadingData ? <CircularProgress size={20}/> : null}
                        >
                            {isLoadingData ? 'Eliminando...' : 'Continuar'}
                        </StyledButton>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

export default DeleteModal;

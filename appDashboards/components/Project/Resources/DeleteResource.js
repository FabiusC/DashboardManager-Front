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
import { deleteRequest } from "../../../helpers/dashboardAPI/genericRequest";


const DeleteProduct = ({ setIsDeleteModal, user, titleProductDelete, idProductDelete, handleProduct }) => {

    const [productTitle, setProductTitle] = useState();
    const [productIndex, setProductIndex] = useState()
    const [verifyTitle, setVerifyTitle] = useState();
    const [isLoadingData, setIsLoadingData] = useState(false);
    const dispatch = useDispatch();


    useEffect(() => {
        if (idProductDelete != undefined) {
            setProductTitle(titleProductDelete)
            setProductIndex(idProductDelete)
        } else {
            dispatch(pushNotification({ "msg": "Servicio no disponible", "status": "err" }));
        }
    }, [])


    const handleChangeText = (e) => {
        setVerifyTitle(e.target.value)
    }

    const deleteProduct = async () => {
        setIsLoadingData(true)
        const id = { id: productIndex }
        const response = await deleteRequest(dispatch, user.userID, 'product', 'product', 'product_id', id);
        if (response[0]) {
            setTimeout(() => {
                handleProduct();    
                setIsDeleteModal(false); 
                setIsLoadingData(false); 
            }, 1500); 
        } else {
            setIsLoadingData(false); 
        }
    }

    const isButtonEnabled = verifyTitle === productTitle;

    return (
        <Box className="pad_35">
            <Typography variant="h6" noWrap  component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                Eliminación de producto
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
                                La acción que desea realizar no se puede revertir. Confirmar esta acción implica la eliminación de todas las relaciones asociadas al producto 
                                <strong>{productTitle}.</strong>
                            </Typography>
                            <Typography component="div" sx={{ textAlign: "justify", fontWeight: "500", marginBottom: "10px", fontSize: "16px" }}>
                                Para confirmar la eliminación por favor ingresar el título del producto a continuación: 
                            </Typography>
                            <Box className="center_horz gap_2_undetermine">                                    
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    type="text"
                                    placeholder="Ingrese el título del producto"
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
                        onClick={deleteProduct}
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

export default DeleteProduct
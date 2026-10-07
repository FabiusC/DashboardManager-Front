/* 
Name: SecurityConfirmation
Action: set security question for login
*/

import _ from 'lodash';
import { useState } from 'react';
import { addUserInfo, addPermissions, pushNotification } from '../../redux/actions';
import { StyledButton } from '../Recursive/mui_styled_components';
import { useDispatch } from 'react-redux';
import Router from "next/router";
import {
    Divider,
    Typography,
    Box,
    Tooltip,
    Paper,
    TextField,
    IconButton,
    Button
} from '@mui/material';
import {
    addSecurityInformation,
    getUserLogout
} from '../../services/creangelAuthAPI'
import {
    validatorAPIBasicParameters,
} from '../../source/validators';
import NotificatorLogin from '../Recursive/NotificatorLogin';
import {
    validateExpirationTime
} from '../../source/recursiveSecurity';
//=====Icons    
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Container } from '@mui/system';
import { InfoOutlined } from '@mui/icons-material';


const SecurityConfirmation = (props) => {
    const staticPrefix = process.env.staticPrefix;
    const [securityInput, setSecurityInput] = useState({
        "question": "",
        "answer": ""
    });
    const [passwordInput, setPasswordInput] = useState("");
    const [viewPassword, setViewPassword] = useState(false)
    const dispatch = useDispatch();
    const verbose = false;

    /*
    =======================================================
    ===============VERBOSE=================================
    =======================================================
    */

    if (verbose) { console.log("SecurityConfirmation0", props) }
    if (verbose) { console.log("SecurityConfirmation2", passwordInput) }
    if (verbose) { console.log("SecurityConfirmation6", viewPassword) }

    /*
    ==============================================================
    ===============CONTROL FUNCTIONS==============================
    ==============================================================
    */

    const handleChangeUserInput = (event, section) => {
        setSecurityInput((prev) => {
            let deepCopyPrev = _.cloneDeep(prev)
            deepCopyPrev[section] = event.target.value
            return deepCopyPrev
        });
    }

    const handleChangePasswordInput = (event) => {
        setPasswordInput(event.target.value);
    }

    const handleBack = () => {
        handleKillSession(props.token, props.tokenDecoded)
    }

    const handleKillSession = async (tokenAccess, tokenDecoded) => {
        if (verbose) { console.log("handleToken0", tokenAccess) }
        let stateExpiration = validateExpirationTime(tokenDecoded.expiration)
        if (verbose) { console.log("handleToken1", stateExpiration) }
        if (stateExpiration) {
            let requestHeader = {
                'Authorization': 'Bearer ' + tokenAccess,
                'Content-Type': 'application/json'
            }
            let responseLogout = await getUserLogout(requestHeader);
            const [validResponseLogout, responseContentLogout] = validatorAPIBasicParameters(responseLogout);
            if (verbose) { console.log("handleToken2", validResponseLogout) }
            if (verbose) { console.log("handleToken3", responseContentLogout) }
        }
        props.setDisplayOptions((prev) => {
            return prev.map((eachOption) => {
                if (eachOption.id == "login") {
                    return { ...eachOption, state: true }
                } else {
                    return { ...eachOption, state: false }
                }
            })
        })
        props.setUserWithSecurityQuestion(true);
        props.setTokenAccess("");
        props.setTokenDecoded("");
    }

    const handleAddSecurityConfig = async () => {
        let validatorSecurity = checkerUserInput(securityInput)
        let validatorPassword = checkerPasswordInput(passwordInput)
        if (validatorSecurity?.status == "ok" && validatorPassword?.status == "ok") {
            let stateExpiration = validateExpirationTime(props.tokenDecoded.expiration)
            if (stateExpiration) {
                if (verbose) { console.log("entro bien manda el endpoitn") }
                let requestHeader = {
                    'Authorization': 'Bearer ' + props.token,
                    'Content-Type': 'application/json'
                }
                let requestBody = {
                    "answer_security": securityInput.answer,
                    "question_security": securityInput.question,
                    "password": passwordInput,
                    "user_id": props.tokenDecoded.sub
                }
                if (verbose) { console.log("handleTokenAdd0", requestHeader) }
                if (verbose) { console.log("handleTokenAdd1", requestBody) }
                let responseSecurityConfig = await addSecurityInformation(requestBody, requestHeader);
                if (verbose) { console.log("handleTokenAdd1A", responseSecurityConfig) }
                let notif2return = {}
                if (responseSecurityConfig?.status == "ok" || responseSecurityConfig?.status == true) {
                    notif2return = {
                        "msg": `La información de seguridad ha sido almacenada exitosamente.`,
                        "status": "ok",
                    }
                    dispatch(pushNotification(notif2return));
                    dispatch(addUserInfo({
                        "userID": props.token,
                        "userData": props.tokenDecoded
                    }));
                    dispatch(addPermissions(props.token));
                    Router.push(props.forward);
                } else {
                    notif2return = {
                        "msg": `No se pudo finalizar el proceso de almacenamiento de información de seguridad del usuario. Intente más tarde.`,
                        "status": "err",
                    }
                    dispatch(pushNotification(notif2return));
                }
            } else {
                props.setDisplayOptions((prev) => {
                    return prev.map((eachOption) => {
                        if (eachOption.id == "login") {
                            return { ...eachOption, state: true }
                        } else {
                            return { ...eachOption, state: false }
                        }
                    })
                })
                props.setUserWithSecurityQuestion(true);
                props.setTokenAccess("");
                props.setTokenDecoded("");
            }
        } else if (validatorSecurity?.status == "err") {
            dispatch(pushNotification(validatorSecurity))
        } else if (validatorPassword?.status == "err") {
            dispatch(pushNotification(validatorPassword))
        }
    }

    const checkerUserInput = (securityInputData) => {
        let notif2return = {}
        if (securityInputData.question == "" || securityInputData.question == undefined) {
            notif2return = {
                "msg": "El campo de la pregunta de seguridad está vacío.",
                "status": "err",
            }
        } else if (securityInputData.question.length > 100) {
            notif2return = {
                "msg": "La pregunta de seguridad no puede contener más de 100 caracteres.",
                "status": "err",
            }
        } else if (securityInputData.answer == "" || securityInputData.answer == undefined) {
            notif2return = {
                "msg": "El campo de la respuesta de seguridad está vacío.",
                "status": "err",
            }
        } else if (securityInputData.answer.length > 30) {
            notif2return = {
                "msg": "La respuesta de seguridad no puede contener más de 30 caracteres.",
                "status": "err",
            }
        } else {
            notif2return = {
                "msg": "El usuario está ok",
                "status": "ok",
            }
        }
        return notif2return
    }

    const checkerPasswordInput = (securityPassData) => {
        let notif2return = {}
        if (securityPassData == "" || securityPassData == undefined) {
            notif2return = {
                "msg": "El campo de ingreso de constraseña está vacío.",
                "status": "err",
            }
        } else if (securityPassData.length > 150) {
            notif2return = {
                "msg": "La constraseña no puede contener más de 150 caracteres.",
                "status": "err",
            }
        } else {
            notif2return = {
                "msg": "El usuario está ok",
                "status": "ok",
            }
        }
        return notif2return
    }

    const handleViewPassword = () => {
        setViewPassword(prev => {
            let deepCopyPrev = _.cloneDeep(prev)
            return !deepCopyPrev
        })
    }

    /*
    ==============================================================
    ===============RENDER=========================================
    ==============================================================
    */

    const config = props.config

    return (
        <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: '100%', 
            }}>
            <Container component="main" maxWidth={false} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', py:2 }}>
                <Paper
                    elevation={3}
                    sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: config.form.backgroundColor,
                    width: config.form.width,
                    border: config.form.border ? `1px solid ${config.form.borderColor}` : 'none',
                    }}
                >
                    <Typography variant="h5" color={config.form.titleColor} sx={{ mb: 2, textAlign: 'center' }}>
                    Configuración de seguridad
                    </Typography>
                    <Divider sx={{ width: '100%', mb: 3 }} />
                    <Typography variant="body1" sx={{ mb: 3, textAlign: 'justify' }}>
                    Esta configuración se ha habilitado para recuperar su contraseña en caso de olvido. Por favor siga las instrucciones.
                    </Typography>
                    <Box component="form" sx={{ width: '100%' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            Ingrese una pregunta de seguridad
                            <Tooltip title="Ingrese una pregunta de seguridad. Longitud máxima de 100 caracteres. Ej: ¿Cuál es el nombre de mi primera mascota?" placement="right">
                            <InfoOutlined sx={{ fontSize: 16, ml: 1 }} />
                            </Tooltip>
                        </Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Ej: ¿Cuál es el nombre de mi primera mascota?"
                            value={securityInput.question}
                            onChange={(e) => handleChangeUserInput(e, 'question')}
                            sx={{ mb: 3 }}
                        />
                        <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            Ingrese la respuesta a su pregunta de seguridad
                            <Tooltip title="Ingrese la respuesta a su pregunta de seguridad. Longitud máxima de 30 caracteres." placement="right">
                            <InfoOutlined sx={{ fontSize: 16, ml: 1 }} />
                            </Tooltip>
                        </Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Ej: Pepe"
                            value={securityInput.answer}
                            onChange={(e) => handleChangeUserInput(e, 'answer')}
                            sx={{ mb: 3 }}
                        />
                        <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            Ingrese su contraseña actual
                            <Tooltip title="Ingrese su contraseña de acceso." placement="right">
                            <InfoOutlined sx={{ fontSize: 16, ml: 1 }} />
                            </Tooltip>
                        </Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            type={viewPassword ? 'text' : 'password'}
                            onChange={(e) => { handleChangePasswordInput(e) }}
                            value={passwordInput}
                            InputProps={{
                            endAdornment: (
                                <IconButton onClick={handleViewPassword} edge="end">
                                {viewPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                                </IconButton>
                            ),
                            }}
                            sx={{ mb: 3 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                            <Button
                            variant="contained"
                            onClick={() => { handleBack() }}
                            sx={{
                                backgroundColor: 'grey.400',
                                '&:hover': {
                                backgroundColor: 'grey.300',
                                },
                            }}
                            >
                            Volver
                            </Button>
                            <Button
                            variant="contained"
                            onClick={() => { handleAddSecurityConfig() }}
                            sx={{
                                backgroundColor: config.form.button.backgroundColor,
                                color: config.form.button.textColor,
                                '&:hover': {
                                backgroundColor: config.form.button.backgroundColor,
                                opacity: 0.9,
                                },
                            }}
                            >
                            Guardar
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    )
}

export default SecurityConfirmation;
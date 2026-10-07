/* 
Name: RecoveryPassword
Action: recover password for login
*/

import _ from 'lodash';
import { useEffect, useState } from 'react';
import { pushNotification } from '../../redux/actions';
import { StyledButton } from '../Recursive/mui_styled_components';
import { connect, useDispatch } from 'react-redux';
import {
    Divider,
    Typography,
    Box,
    Tooltip,
    Paper,
    TextField,
    Link,
    Button,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    getCheckUser,
    checkSecurityAnswer,
    updateUserPassword
} from '../../services/creangelAuthAPI'
import {
    validatorAPIBasicParameters,
} from '../../source/validators';
import NotificatorLogin from '../Recursive/NotificatorLogin';
import Grow from '@mui/material/Grow';
//=====Icons    
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { Container } from '@mui/system';

const PasswordRecovery = (props) => {
    const staticPrefix = process.env.staticPrefix;
    const [userInput, setUserInput] = useState("");
    const [passwordForm, setPasswordForm] = useState([
        { "id": "password", "info": "La constraseña ingresada debe ser alfanumérica y debe contener al menos 8 caracteres.", "value": "", "stateView": false },
        { "id": "confirmPassword", "info": "Ingrese la misma contraseña que desea registrar para este usuario.", "value": "", "stateView": false },
    ]);
    const [userDataSecurity, setUserDataSecurity] = useState();
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [stage, setStage] = useState(1);
    const [userValidated, setUserValidated] = useState({});
    const [checkedS1, setCheckedS1] = useState(true);
    const [checkedS2, setCheckedS2] = useState(false);
    const [checkedS3, setCheckedS3] = useState(false);
    const dispatch = useDispatch();
    const verbose = false;

    /*
    =======================================================
    ===============VERBOSE=================================
    =======================================================
    */

    if (verbose) { console.log("ModalPasswordRecovery0", props) }
    if (verbose) { console.log("ModalPasswordRecovery1", userInput) }
    if (verbose) { console.log("ModalPasswordRecovery8", userDataSecurity) }
    if (verbose) { console.log("ModalPasswordRecovery9", stage) }
    if (verbose) { console.log("ModalPasswordRecovery10", checkedS1) }
    if (verbose) { console.log("ModalPasswordRecovery11", checkedS2) }
    if (verbose) { console.log("ModalPasswordRecovery12", checkedS3) }
    if (verbose) { console.log("ModalPasswordRecovery13", securityAnswer) }

    /*
    =======================================================
    ===============USEEFFECTS==============================
    =======================================================
    */

    useEffect(() => {
        if (stage == 1) {
            setCheckedS1(true)
            setCheckedS2(false)
            setCheckedS3(false)
        } else if (stage == 2) {
            setCheckedS1(false)
            setCheckedS2(true)
            setCheckedS3(false)
        } else if (stage == 3) {
            setCheckedS1(false)
            setCheckedS2(false)
            setCheckedS3(true)
        }
    }, [stage]);

    /*
    ==============================================================
    ===============CONTROL FUNCTIONS==============================
    ==============================================================
    */

    const handleChangeUserAnswer = (event) => {
        setSecurityAnswer(event.target.value);
    }

    const handleChangeUserInput = (event) => {
        setUserInput(event.target.value);
    }

    const handleChangePasswordForm = (evt, id) => {
        setPasswordForm((prev) => {
            let deepCopyPrev = _.cloneDeep(prev)
            deepCopyPrev.map((eachOne) => {
                if (eachOne.id === id) {
                    eachOne.value = evt.target.value
                }
            })
            return deepCopyPrev
        })
    }

    const handleViewPassword = (evt, id) => {
        setPasswordForm((prev) => {
            let deepCopyPrev = _.cloneDeep(prev)
            deepCopyPrev.map((eachOne) => {
                if (verbose) { console.log("ModalCreateUser3a", eachOne) }
                if (verbose) { console.log("ModalCreateUser3b", id) }
                if (eachOne.id === id) {
                    eachOne.stateView = !eachOne.stateView
                }
            })
            return deepCopyPrev
        })
    }

    const handleBack = () => {
        setUserInput("");
        setPasswordForm((prev) => {
            let deepCopyPrev = _.cloneDeep(prev)
            deepCopyPrev.map((eachOne) => {
                eachOne.value = ""
                eachOne.stateView = false
            })
            return deepCopyPrev
        });
        setUserDataSecurity();
        setSecurityAnswer("");
        props.setDisplayOptions((prev) => {
            return prev.map((eachOption) => {
                if (eachOption.id == "login") {
                    return { ...eachOption, state: true }
                } else {
                    return { ...eachOption, state: false }
                }
            })
        })
    }

    const handleCheckUser = async (e, userIn) => {
        let validatorUser = checkerUserInput(userIn)
        if (validatorUser?.status == "ok") {
            let objDataIn = {}
            if (userIn.includes("@")) {
                objDataIn["username"] = userIn
            } else {
                objDataIn["username"] = userIn
            }
            let responseCheck = await getCheckUser(objDataIn);
            if (verbose) { console.log("loginData0", responseCheck) }
            const [validLogin, responseLoginData] = validatorAPIBasicParameters(responseCheck);
            if (verbose) { console.log("loginData1", validLogin) }
            if (verbose) { console.log("loginData2", responseLoginData) }
            if (validLogin == true) {
                if (responseLoginData.status == "ok") {
                    setUserDataSecurity({...responseLoginData.data, ...objDataIn})
                    setStage(2)
                } else {
                    if (responseLoginData.msg == "User not found") {
                        dispatch(pushNotification({ "msg": "Usuario no encontrado.", "status": "err" }))
                    } else if (responseLoginData.msg == "User don't have security question, contact administrator") {
                        dispatch(pushNotification({ "msg": "Usuario sin pregunta de seguridad para restaurar contraseña. Intente iniciar sesión para diligenciar la configuración de seguridad. Si no recuerda su contraseña, contacte a su proveedor.", "status": "err" }))
                    } else if (responseLoginData.msg == "User block, contact administrator") {
                        dispatch(pushNotification({ "msg": "Su usuario se encuentra bloqueado, por favor contacte con su proveedor.", "status": "err" }))
                    } else if (responseLoginData.msg == "User already under password recovery") {
                        dispatch(pushNotification({ "msg": "Su usuario ya habilitó la recuperación de constraseña, por favor espere 10 minutos desde que realizó su primer intento para comenzar un nuevo proceso.", "status": "err" }))
                    } else {
                        dispatch(pushNotification({ "msg": "Servicio no disponible. Intente más tarde.", "status": "err" }))
                    }
                }
            } else {
                dispatch(pushNotification({ "msg": "Servicio no disponible. Intente más tarde.", "status": "err" }))
            }
        } else {
            dispatch(pushNotification({ "msg": validatorUser?.msg, "status": "err" }))
        }
    }

    const handleVerifyAnswer = async (e, userAnswer) => {
        let validatorAnswer = checkerUserAnswer(userAnswer)
        if (validatorAnswer?.status == "ok") {
            let objDataIn = {}
            let userDataInfo = {}
            objDataIn["secret_key"] = userDataSecurity?.recovery_key
            objDataIn["answer_security"] = userAnswer
            if (userDataSecurity?.email != undefined) {
                userDataInfo["email"] = userDataSecurity.email
            } else if (userDataSecurity?.username != undefined) {
                userDataInfo["username"] = userDataSecurity.username
            }
            if (verbose) { console.log("loginDataAA0", objDataIn) }
            let responseCheckAnswer = await checkSecurityAnswer({...objDataIn, ...userDataInfo});
            if (verbose) { console.log("loginDataA0", responseCheckAnswer) }
            if (responseCheckAnswer?.status == "ok") {
                setUserValidated(userDataInfo)
                setStage(3)
            } else {
                if (responseCheckAnswer?.msg == "Wrong answer") {
                    dispatch(pushNotification({ "msg": "Respuesta incorrecta.", "status": "err" }))
                } else if (responseCheckAnswer?.msg == "User not under password recovery") {
                    dispatch(pushNotification({ "msg": "Ha excedido el número de intentos para ingresar la respuesta correcta. Su usuario se encuentra bloqueado, por favor contacte con su proveedor.", "status": "err" }))
                } else {
                    dispatch(pushNotification({ "msg": "Servicio no disponible. Intente más tarde.", "status": "err" }))
                }
            }
        } else {
            dispatch(pushNotification({ "msg": validatorAnswer?.msg, "status": "err" }))
        }
    }

    const handleSaveNewPassword = async (e, passwordData) => {
        if (verbose) { console.log("passwordInfo", passwordData) }
        let validatorAnswer = checkerPassword(passwordData)
        if (validatorAnswer?.status == "ok") {
            let objDataIn = {}
            objDataIn["secret_key"] = userDataSecurity?.recovery_key
            objDataIn["new_password"] = passwordData[0].value
            if (verbose) { console.log("newPassword0", objDataIn) }
            let responseCheckAnswer = await updateUserPassword({...objDataIn, ...userValidated});
            if (verbose) { console.log("newPassword1", responseCheckAnswer) }
            if (responseCheckAnswer?.status == "ok") {
                dispatch(pushNotification({ "msg": "Su constraseña ha sido reestablecida exitosamente.", "status": "ok" }))
                handleBack()
            } else {
                dispatch(pushNotification({ "msg": "Servicio no disponible. Intente más tarde.", "status": "err" }))
            }
        } else {
            dispatch(pushNotification({ "msg": validatorAnswer?.msg, "status": "err" }))
        }
    }

    const checkerUserInput = (userInn) => {
        let notif2return = {}
        if (userInn == "" || userInn == undefined) {
            notif2return = {
                "msg": "El usuario está vacío.",
                "status": "err",
            }
        } else if (userInn.length > 50) {
            notif2return = {
                "msg": "El nombre de usuario no puede contener más de 50 caracteres.",
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

    const checkerUserAnswer = (userAnswer) => {
        let notif2return = {}
        if (userAnswer == "" || userAnswer == undefined) {
            notif2return = {
                "msg": "La respuesta de seguridad está vacía.",
                "status": "err",
            }
        } else if (userAnswer.length > 30) {
            notif2return = {
                "msg": "La respuesta ingresada no puede contener más de 30 caracteres.",
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

    const checkerPassword = (pjUser) => {
        let notif2return = {}
        let passwordVal = new RegExp(/^(?=.*[0-9])(?=.*[a-zA-Z])[ a-zA-Z0-9!¡@#$%^&*_+=\[\]{}'"\\|<>\/?.;-]+$/)
        if (pjUser[0].value == "" || pjUser[0].value == undefined) {
            notif2return = {
                "msg": "La contraseña no puede ser vacía.",
                "status": "err",
            }
        } else if (pjUser[0].value.length < 8) {
            notif2return = {
                "msg": "La contraseña ingresada debe contener al menos 8 caracteres.",
                "status": "err",
            }
        } else if (pjUser[0].value.search(passwordVal) == -1) {
            notif2return = {
                "msg": "La contraseña ingresada debe contener al menos una letra y un número.",
                "status": "err",
            }
        } else if (pjUser[0].value.length > 150) {
            notif2return = {
                "msg": "La contraseña no puede contener más de 150 caracteres.",
                "status": "err",
            }
        } else if (pjUser[1].value == "" || pjUser[1].value == undefined) {
            notif2return = {
                "msg": "No se ha ingresado la confirmación de contraseña.",
                "status": "err",
            }
        } else if (pjUser[0].value != pjUser[1].value) {
            notif2return = {
                "msg": "La contraseña y su confirmación no coinciden.",
                "status": "err",
            }
        } else {
            notif2return = {
                "msg": "El usuario ha sido creado exitosamente.",
                "status": "ok",
            }
        }
        return notif2return
    }

    /*
    ==============================================================
    ===============RENDER=========================================
    ==============================================================
    */

    const config= props.config

    return (

        <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: '100%', 
            // overflow: 'auto'
          }}>
            <Container maxWidth={false} sx={{ py: 2 }}>
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
                  margin: 'auto',
                }}
              >
                <Typography component="h1" variant="h5" color={config.form.titleColor} sx={{ mb: 3 }}>
                  Recuperar contraseña
                </Typography>
                <Box component="form" sx={{ width: '100%' }}>
                  {stage === 1 && (
                    <>
                        <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Usuario o correo electrónico"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => { handleChangeUserInput(e) }}
                        value={userInput}
                        />
                        <Box className="fullWidht center_horz">
                            <NotificatorLogin />
                        </Box>
                        <Box sx={{display: 'flex', gap: 2}}>
                            <Button 
                            fullWidth
                            variant='contained'
                            color= 'error'
                            onClick={() => { 
                                handleBack(); 
                            }}
                            sx={{mt: 3,
                                mb: 2,
                                backgroundColor: 'grey.400',
                                '&:hover': {
                                backgroundColor: 'grey.300',
                                }}
                            }>
                            Cancelar
                            </Button>
                            <Button
                            fullWidth
                            variant="contained"
                            onClick={(e) => { handleCheckUser(e, userInput)}}
                            sx={{
                            mt: 3,
                            mb: 2,
                            backgroundColor: config.form.button.backgroundColor,
                            color: config.form.button.textColor,
                            '&:hover': {
                                backgroundColor: config.form.button.backgroundColor,
                                opacity: 0.9
                            }
                            }}
                            >
                            Validar
                            </Button>
                        </Box>
                    </>             
                  )}
                  {stage === 2 && (
                    <>
                    <TextField
                        type="text"
                        fullWidth
                        value={userDataSecurity?.question_security}
                        readonly={true}
                        disabled={true}
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="securityAnswer"
                      label="Respuesta de seguridad"
                      name="securityAnswer"
                      value={securityAnswer}
                      onChange={(e) => { handleChangeUserAnswer(e) }}
                    />

                    <Box className="fullWidht center_horz">
                        <NotificatorLogin />
                    </Box>

                    <Box sx={{display: 'flex', gap: 2}}>
                        <Button 
                        fullWidth
                        variant='contained'
                        onClick={() => { 
                            handleBack(); 
                        }}
                        sx={{mt: 3,
                            mb: 2,
                            backgroundColor: 'grey.400',
                            '&:hover': {
                            backgroundColor: 'grey.300',
                            }}
                        }>
                        Cancelar
                        </Button>
                        <Button
                        fullWidth
                        variant="contained"
                        onClick={(e) => { handleVerifyAnswer(e, securityAnswer) }}
                        sx={{
                        mt: 3,
                        mb: 2,
                        backgroundColor: config.form.button.backgroundColor,
                        color: config.form.button.textColor,
                        '&:hover': {
                            backgroundColor: config.form.button.backgroundColor,
                            opacity: 0.9
                        }
                        }}
                        >
                        Continuar
                        </Button>
                    </Box>
                    </>
                  )}
                  {stage === 3 && (
                    <>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="newPassword"
                            label="Nueva contraseña"
                            type={passwordForm[0].stateView ? "text" : "password"}
                            id="newPassword"
                            onChange={(e) => { handleChangePasswordForm(e, "password") }}
                            value={passwordForm[0].value}
                            InputProps={{
                                endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={(e) => { handleViewPassword(e, "password") }}
                                    edge="end"
                                    >
                                    {passwordForm[0].stateView ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                                    </IconButton>
                                </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirmar nueva contraseña"
                            type={passwordForm[1].stateView ? "text" : "password"}
                            id="confirmPassword"
                            onChange={(e) => { handleChangePasswordForm(e, "confirmPassword") }}
                            value={passwordForm[1].value}
                            InputProps={{
                                endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={(e) => { handleViewPassword(e, "confirmPassword") }}
                                    edge="end"
                                    >
                                    {passwordForm[1].stateView ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                                    </IconButton>
                                </InputAdornment>
                                ),
                            }}
                        />

                        <Box className="fullWidht center_horz">
                            <NotificatorLogin />
                        </Box>
                        <Box sx={{display: 'flex', gap: 2}}>
                            <Button 
                            fullWidth
                            variant='contained'
                            color= 'error'
                            onClick={() => { 
                                handleBack(); 
                            }}
                            sx={{mt: 3,
                                mb: 2,
                                backgroundColor: 'grey.400',
                                '&:hover': {
                                backgroundColor: 'grey.300',
                                }}
                            }>
                            Cancelar
                            </Button>
                            <Button
                            fullWidth
                            variant="contained"
                            onClick={(e) => { handleSaveNewPassword(e, passwordForm) }}                            sx={{
                            mt: 3,
                            mb: 2,
                            backgroundColor: config.form.button.backgroundColor,
                            color: config.form.button.textColor,
                            '&:hover': {
                                backgroundColor: config.form.button.backgroundColor,
                                opacity: 0.9
                            }
                            }}
                            >
                            Guardar
                            </Button>
                        </Box>
                    </>
                  )}        
                </Box>
              </Paper>
            </Container>
          </Box>
    )
}

const mapStateToProps = state => {
    return {
        organization: state.organization,
    };
};

export default connect(mapStateToProps, null)(PasswordRecovery);
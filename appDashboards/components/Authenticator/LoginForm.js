/* 
Name: LoginForm
Action: Login form for the app
*/

import _ from 'lodash';
import { useState } from 'react';
import { pushNotification } from '../../redux/actions';
import { StyledButton } from '../Recursive/mui_styled_components';
import { connect, useDispatch } from 'react-redux';
import {
    Divider,
    Typography,
    Box,
    Paper,
    TextField,
    FormControlLabel,
    Checkbox,
    Button,
    Link,
    Grid,
    InputAdornment,
    IconButton,
    Autocomplete,
    CircularProgress
} from '@mui/material';
import {
    getUserLogin,
    checkSecurityInformation,
    getOrganizations
} from '../../services/creangelAuthAPI'
import { ResponseAPIAdapter } from '../../adapters/responseAPIAdapter';
import NotificatorLogin from '../Recursive/NotificatorLogin';
//=====Icons    
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { ErrorOutline } from '@mui/icons-material'
import { Container } from '@mui/system';
import { handleRequestErrorNotification } from '../../source/validators';


const LoginForm = (props) => {
    const staticPrefix = process.env.staticPrefix;
    const [userInput, setUserInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [errorUser, setErrorUser] = useState("");
    const [errorPassword, setErrorPassword] = useState("");
    const [viewPassword, setViewPassword] = useState(false)
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
    const apiAdapter = new ResponseAPIAdapter()
    const dispatch = useDispatch();
    const verbose = false;

    /*
    =======================================================
    ===============VERBOSE=================================
    =======================================================
    */

    if (verbose) { console.log("ModalLogin0", props) }
    if (verbose) { console.log("ModalLogin1", userInput) }
    if (verbose) { console.log("ModalLogin2", passwordInput) }
    if (verbose) { console.log("ModalLogin3", errorUser) }
    if (verbose) { console.log("ModalLogin4", errorPassword) }
    if (verbose) { console.log("ModalLogin6", viewPassword) }
    if (verbose) { console.log("organizationsOptions", organizationOptions) }

    /*
    ==============================================================
    ===============CONTROL FUNCTIONS==============================
    ==============================================================
    */

    const handleChangeUserInput = (event) => {
        setUserInput(event.target.value);
        if (event.target.value != "") {
            setErrorUser("")
        }
    }

    const handleChangePasswordInput = (event) => {
        setPasswordInput(event.target.value);
        if (event.target.value != "") {
            setErrorPassword("")
        }
    }

    const handleClenaAll = () => {
        setUserInput("")
        setPasswordInput("")
        setErrorUser("")
        setErrorPassword("")
    }

    const handleLogin = async (e, userIn, passwordIn) => {
        console.log("inside handle login")
        let validatorUser = checkerUserInput(userIn)
        let validatorPassword = checkerPasswordInput(passwordIn)
        if (validatorUser?.status == "ok" && validatorPassword?.status == "ok") {
            let objDataIn = {
                "username": userIn,
            }
            let responseCheck = await checkSecurityInformation(objDataIn);

            const [validCheckUser, responseCheckUser] = apiAdapter.checkResponse(responseCheck); 
            
            if (verbose) { console.log("loginCheck1", validCheckUser) }
            if (verbose) { console.log("loginCheck2", responseCheckUser) }
            if (validCheckUser == true) {
                if ((responseCheckUser.status == "ok") || (responseCheckUser.data?.data?.has_recovery_question == false)) {
                    let objDataLogin = {
                        "password": passwordIn,
                        "organization_id": props.organization[0]?.id,
                        "username": userIn
                    }
                   
                    console.log(objDataLogin)
                    let responseLogin = await getUserLogin(objDataLogin);
                    
                    const [validLogin, responseLoginData] = apiAdapter.checkResponse(responseLogin);

                    if (verbose) { console.log("loginData1", validLogin) }
                    if (validLogin != true) {
                        let notificationObject = {
                            "msg": `Servicio no disponible, intente más tarde.`,
                            "status": "err"
                        };
                        dispatch(pushNotification(notificationObject));
                    } else {
                        if (verbose) { console.log("loginData2", responseLoginData) }
                        let responseStatus = responseLoginData["status"];
                        let userData = responseLoginData["data"];
                        if (responseStatus == "err" && responseLoginData.msg == "User not active") {
                            let notificationObject = {
                                "msg": `El usuario ingresado no está activo.`,
                                "status": "err"
                            };
                            dispatch(pushNotification(notificationObject));
                        } else if (responseStatus == "err") {
                            let notificationObject = {
                                "msg": `Credenciales incorrectas.`,
                                "status": "err"
                            };
                            dispatch(pushNotification(notificationObject));
                        } else if (responseStatus == "ok") {
                            if (( responseCheckUser.data?.data?.has_recovery_question == false && responseCheckUser.data?.data?.ldap == false)) {
                                props.setUserWithSecurityQuestion(false)
                            }
                            props.setTokenAccess(userData.access_token)
                        } else {
                            let notificationObject = {
                                "msg": `Servicio no disponible, intente más tarde.`,
                                "status": "err"
                            };
                            dispatch(pushNotification(notificationObject));
                        }
                    }
                } else {
                    if (responseCheckUser.msg == "User not found") {
                        dispatch(pushNotification({ "msg": "El usuario ingresado no existe.", "status": "err" }))
                    } else {
                        dispatch(pushNotification({ "msg": "Servicio no disponible. Intente más tarde.", "status": "err" }))
                    }
                }
            } else {
                dispatch(pushNotification({ "msg": "Servicio no disponible. Intente más tarde.", "status": "err" }))
            }
        }
    }

    const checkerUserInput = (passwordIn) => {
        let notif2return = {}
        if (passwordIn == "" || passwordIn == undefined) {
            notif2return = {
                "msg": "El campo usuario está vacío.",
                "status": "err",
            }
            setErrorUser(notif2return.msg);
        } else {
            notif2return = {
                "msg": "El campo usuario está ok",
                "status": "ok",
            }
            setErrorUser("")
        }
        return notif2return
    }

    const checkerPasswordInput = (userInput) => {
        let notif2return = {}
        if (userInput == "" || userInput == undefined) {
            notif2return = {
                "msg": "El campo contraseña está vacío.",
                "status": "err",
            }
            setErrorPassword("El campo contraseña está vacío.")
        } else {
            notif2return = {
                "msg": "El campo contraseña está ok",
                "status": "ok",
            }
            setErrorPassword("")
        }
        return notif2return
    }

    const handleViewPassword = () => {
        setViewPassword(prev => {
            let deepCopyPrev = _.cloneDeep(prev)
            return !deepCopyPrev
        })
    }

    const handleRecoveryPassword = () => {
        props.setDisplayOptions((prev) => {
            return prev.map((eachOption) => {
                if (eachOption.id == "passwordRecovery") {
                    return { ...eachOption, state: true }
                } else {
                    return { ...eachOption, state: false }
                }
            })
        })
    }

    const handleLoginEnter = (e) => {
        if (e.key === 'Enter') {
            handleLogin(e, userInput, passwordInput)
        }
    }

    const searchOrganizations = async (searchText) => {
        if (!searchText.trim()) {
            setOrganizationOptions([]);
            setIsLoadingOrganizations(false);
            return;
        }
        setIsLoadingOrganizations(true);
          const response = await getOrganizations( {
            organization_name: searchText
          });

          const [validResponse, responseCheck] = apiAdapter.checkResponse(response) 
         
          if(validResponse){
            if(responseCheck.status == "ok"){
              setOrganizationOptions(responseCheck.data)
              setIsLoadingOrganizations(false);
            } else {
              setOrganizationOptions([]);
              setIsLoadingOrganizations(false);
            }
          } else {
            setOrganizationOptions([]);
            setIsLoadingOrganizations(false);
          }
      };
    /*
    ==============================================================
    ===============RENDER=========================================
    ==============================================================
    */


    const config= props.config
    console.log("passwordInput", passwordInput)

    return (
        <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: '100%', 
          }}>
            <Container maxWidth={false} sx={{ py: 2 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: config.login_form_style?.["background-color"] || 'white',
                  width: {
                    xs: '80%',
                    sm: '70%',
                    md: '50%',
                    lg: '25%',
                  }, 
                  border: config.login_form_style?.["border-width"] ? `${config.login_form_style["border-width"]} solid ${config.login_form_style["border-color"]}` : 'none',
                  margin: 'auto',
                }}
              >
                <Typography 
                  component="h1" 
                  variant="h5" 
                  sx={{
                    color: config.login_form_title_style?.color || 'inherit',
                    fontSize: config.login_form_title_style?.["font-size"] || 'inherit',
                    fontFamily: config.login_form_title_style?.["font-family"] || 'inherit',
                    fontWeight: config.login_form_title_style?.["font-weight"] || 'inherit',
                  }}
                >
                  {config.login_form_title || 'Login'}
                </Typography>
                <Box component="form" sx={{ mt: 1, width: '100%' }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Usuario"
                    placeholder="Ingrese su usuario"
                    onChange={(e) => { handleChangeUserInput(e) }}
                    onKeyDown={(e) => { handleLoginEnter(e) }}
                    value={userInput}
                    sx={config.login_form_inputs_style}
                  />
                  {errorUser && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        marginTop: 1,
                        fontWeight: 'medium',
                      }}
                    >
                      <ErrorOutline sx={{ fontSize: 14, marginRight: 0.5 }} />
                      {errorUser}
                    </Typography>
                  )}
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="password"
                    type={viewPassword ? "text" : "password"}
                    label="Contraseña"
                    placeholder="Ingrese su contraseña"
                    onChange={(e) => { handleChangePasswordInput(e) }}
                    onKeyDown={(e) => { handleLoginEnter(e) }}
                    value={passwordInput}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => { handleViewPassword() }}
                            edge="end"
                          >
                            {viewPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={config.login_form_inputs_style}
                  />
                  {errorPassword && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        marginTop: 1,
                        fontWeight: 'medium',
                      }}
                    >
                      <ErrorOutline sx={{ fontSize: 14, marginRight: 0.5 }} />
                      {errorPassword}
                    </Typography>
                  )}
                  <Autocomplete
                    id="organization-search"
                    options={organizationOptions}
                    getOptionLabel={(option) => option}
                    onChange={(event, newValue) => {
                        setSelectedOrganization(newValue);
                    }}
                    onInputChange={(event, newInputValue) => {
                        searchOrganizations(newInputValue);
                    }}
                    renderInput={(params) => (
                        <TextField
                        {...params}
                        label="Organización"
                        margin="normal"
                        variant="outlined"
                        fullWidth
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                            <>
                                {isLoadingOrganizations ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                            ),
                        }}
                        sx={config.login_form_inputs_style}
                        />
                    )}
                    />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="captcha"
                    label="Ingrese el código de seguridad"
                    sx={config.login_form_inputs_style}
                  />
      
                  <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2}}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          value="remember"
                          color="primary"                           
                        />
                      }
                      label="Recordarme"
                    />
                    <Link
                      onClick={(e) => { 
                        e.preventDefault(); 
                        handleRecoveryPassword(); 
                      }}
                      sx={{
                        fontSize: "14px",
                        textAlign: "center",
                        textDecoration: "underline",
                        cursor: "pointer"
                      }}
                    >
                      ¿Ha olvidado su contraseña?
                    </Link>
                  </Box>
                  
                  <Box sx={{
                    display: 'flex', 
                    gap: 2,
                    width: '100%',
                    mt: 3,
                    mb: 2
                  }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleClenaAll()}
                      sx={{
                        backgroundColor: 'grey.400',
                        '&:hover': {
                          backgroundColor: 'grey.300',
                        },
                      }}
                    >
                      Limpiar
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        backgroundColor: config.login_form_button_style?.["background-color"] || 'primary.main',
                        color: config.login_form_button_style?.color || 'white',
                        '&:hover': {
                          backgroundColor: config.login_form_button_style?.["background-color"] || 'primary.dark',
                          opacity: 0.9
                        }
                      }}
                      onClick={(e) => handleLogin(e, userInput, passwordInput)}
                    >
                      {config.login_form_button_text || 'Login'}
                    </Button>
                  </Box>
                  
                  <Box className="fullWidth center_horz">
                    <NotificatorLogin />
                  </Box>
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

export default connect(mapStateToProps, null)(LoginForm);
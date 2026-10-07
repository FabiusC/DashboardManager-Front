/* 
Name: LoginPage
Action: LoginPage
*/

import _ from 'lodash';
import { isValidUUID4 } from '../../source/validators';
import { addUserInfo, addPermissions } from '../../redux/actions';
import { useEffect, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { jwtDecode } from "jwt-decode";
import Router from "next/router";
import LoginForm from './LoginForm';
import { ResponseAPIAdapter } from '../../adapters/responseAPIAdapter';
import {
  Box,
} from '@mui/material';
import AuthenticatorHeader from './AuthenticatorHeader';
import AuthenticatorFooter from './AuthenticatorFooter';
import { getAuthenticatorPublicInfo } from '../../services/creangelAuthAPI';
import AuthenticatorComponentStyleWrapper from './AuthenticatorComponentStyleWrapper';

const Authenticator = ({ organizationID, edition }) => {
  const [tokenAccess, setTokenAccess] = useState("");
  const [tokenDecoded, setTokenDecoded] = useState("");
  const [authenticatorInfo, setAuthenticatorInfo] = useState({});
  const [userWithSecurityQuestion, setUserWithSecurityQuestion] = useState(true);

  const dispatch = useDispatch();
  const apiAdapter = new ResponseAPIAdapter();
  const verbose = false;
  const [displayOptions, setDisplayOptions] = useState([
    { "id": "login", "state": true },
    { "id": "passwordRecovery", "state": false },
    { "id": "securityConfirmation", "state": false },
  ]);


  /* if (verbose) { console.log("LoginA0", props) } */
  if (verbose) { console.log("LoginA2", userWithSecurityQuestion) }
  if (verbose) { console.log("LoginA4", tokenDecoded) }
  if (verbose) { console.log("LoginA5", tokenAccess) }
  if (verbose) { console.log("LoginA6", displayOptions) }


  useEffect(() => {
    if (tokenAccess != "") {
      let tokenDecoded = jwtDecode(tokenAccess);
      setTokenDecoded(tokenDecoded);
      if (verbose) { console.log("tokenLogin1", tokenAccess) }
      if (verbose) { console.log("tokenLogin2", tokenDecoded) }
      if (userWithSecurityQuestion == false) {
        setDisplayOptions((prev) => {
          return prev.map((eachOption) => {
            if (eachOption.id == "securityConfirmation") {
              return { ...eachOption, state: true }
            } else {
              return { ...eachOption, state: false }
            }
          })
        })
      } else {
        dispatch(addUserInfo({
          "userID": tokenAccess,
          "userData": tokenDecoded
        }));
        dispatch(addPermissions(tokenAccess));
        localStorage.setItem("authToken", tokenAccess)
      }
    }
  }, [tokenAccess, userWithSecurityQuestion]);

  useEffect(() => { if (window !== undefined) { window.oncontextmenu = function () { return false; } } }, [])

  const handleGetAuthenticatorPublicInfo = async (organizationID) => {
    if (organizationID === undefined || organizationID === null || organizationID === "" || !isValidUUID4(organizationID)) { 
      Router.push('/NotFound'); return;
    }
    console.log("estoy aqui trayendo cosas de la API")
    let response = await getAuthenticatorPublicInfo(organizationID);
    const [valid, responseLoginData] = apiAdapter.checkResponse(response);
    if (valid) {
      if (responseLoginData.status == "ok" || responseLoginData.status == "success") {
        const convertKeysToCamelCase = (obj) => {
          if (Array.isArray(obj)) {
            return obj.map(v => convertKeysToCamelCase(v));
          } else if (obj !== null && obj.constructor === Object) {
            return Object.keys(obj).reduce((result, key) => {
              const newKey = _.camelCase(key);
              result[newKey] = convertKeysToCamelCase(obj[key]);
              return result;
            }, {});
          }
          return obj;
        };

        let data_ = convertKeysToCamelCase(responseLoginData.data);
        if (responseLoginData.data) { setAuthenticatorInfo(data_)}
      } else { dispatch(pushNotification({ "msg": responseLoginData.msg, "status": "err" })) }
    } else {
      dispatch(pushNotification({ "msg": "Formato de respuesta de la API incorrecto.", "status": "err" }))
    }
  }
  console.log("AuthenticatorInfo", authenticatorInfo)

  return (
    <AuthenticatorComponentStyleWrapper
      propsObject={authenticatorInfo["autenticatorContainerStyle"]}
      objectName="authenticatorContainerStyle"
      edition={edition}
    >
      <Box id="authenticator_container">
        <AuthenticatorHeader config={authenticatorInfo} edition={edition} />
        <LoginForm
          key={"loginForm"}
          setTokenAccess={setTokenAccess}
          organization={organizationID}
          forward={""}
          /* handleCheckUser={handleCheckUser} */
          setUserWithSecurityQuestion={setUserWithSecurityQuestion}
          setDisplayOptions={setDisplayOptions}
          config={authenticatorInfo}
        />
        <AuthenticatorFooter config={authenticatorInfo} edition={edition} />
      </Box>
    </AuthenticatorComponentStyleWrapper>
  );
}

const mapStateToProps = state => {
  return {
    organization: state.organization,
    user: state.user,
  };
};

export default connect(mapStateToProps)(Authenticator);
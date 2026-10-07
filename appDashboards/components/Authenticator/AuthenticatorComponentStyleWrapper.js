/* 
Name: LoginPage
Action: LoginPage
*/

import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { connect, useDispatch } from 'react-redux';


const AuthenticatorComponentStyleWrapper = ({
  children,
  propsObject,
  objectName,
  edition=false
}) => {
  const [propsChildObjectParsed, setPropsChildObjectParsed] = useState({});
  useEffect(() => { setPropsChildObjectParsed(propsObject); }, []);
  useEffect(() => { setPropsChildObjectParsed(propsObject); }, [propsObject]);

  return (
    <div
      id={`${objectName}StyleComponentWrapper`}
      className="AuthenticatorComponentStyleWrapper"
    >
      {React.Children.map(children, child => {
        return React.cloneElement(child, { propsChildObjectParsed });
      })}
    </div>
  );
}

export default AuthenticatorComponentStyleWrapper;
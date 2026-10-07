import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import AuthenticatorComponentStyleWrapper from './AuthenticatorComponentStyleWrapper';

const AuthenticatorHeader = ({ config, edition }) => {
  console.log("AuthenticatorHeader", config, edition)
  if (config === undefined || Object.keys(config).length === 0) { return <></> }
  return (
    <>
      {
        ["Primary", "Secondary"].map((header) => {
          let headerConfigName = `${header}Header`
          let _headerConfigName = headerConfigName.charAt(0).toLowerCase() + headerConfigName.slice(1)
          return (
            <>
              {config[`has${headerConfigName}`] !== undefined && config[`has${headerConfigName}`] &&
                <AuthenticatorComponentStyleWrapper
                  propsObject={config[`${_headerConfigName}Style`]}
                  objectName={`${_headerConfigName}Style`}
                  edition={edition}>
                  <Box id={`${_headerConfigName}Style`} >
                    {
                      ["Left", "Center", "Right"].map((position) => {
                        let configName = `${_headerConfigName}${position}ElementStyle`
                        let hasConfigName = `has${configName.charAt(0).toUpperCase()}${configName.slice(1)}`
                        if (config[hasConfigName] !== undefined && config[hasConfigName]) {
                          return (
                            <></>
                          )
                        }
                        let isImg = config[configName].imageUrl !== undefined && config[configName].imageUrl !== null && config[configName].imageUrl !== ""
                        if (config[configName]) {
                          return (
                            <AuthenticatorComponentStyleWrapper
                              propsObject={config[configName]}
                              objectName={configName}
                              edition={edition}>
                              {isImg
                                ? <img src={config[configName].imageUrl} />
                                : <Box>{config[configName].textValue}</Box>
                              }
                            </AuthenticatorComponentStyleWrapper>
                          )
                        }
                      })
                    }
                  </Box>
                </AuthenticatorComponentStyleWrapper>}
            </>
          )
        })
      }
    </>
  );
}

export default AuthenticatorHeader;
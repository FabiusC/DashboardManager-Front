import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import AuthenticatorComponentStyleWrapper from './AuthenticatorComponentStyleWrapper';

const AuthenticatorFooter = ({ config, edition }) => {
  console.log("AuthenticatorFooter", config, edition)

  const [columnsConfig, setColumnsConfig] = useState([])

  if (columnsConfig === undefined || Object.keys(columnsConfig).length === 0 || columnsConfig === null) {
    return <></>
  }

  useEffect(() => {
    if (config === undefined) { return; }
    if (
      config.footerColumnsElements === undefined ||
      config.footerColumnsElements === null ||
      !config.footerColumnsElements.hasOwnProperty("length") ||
      config.footerColumnsElements.length === 0) { return; }
    let maxColumns = 0;
    config.footerColumnsElements.forEach(element => {
      let columnNumber = parseInt(element["column"]);
      if (columnNumber > maxColumns) { maxColumns = columnNumber; }
    });
    const columnsArray = [];
    for (let i = 0; i <= maxColumns; i++) {
      const columns_aux = [];
      for (let j = 0; j < config.footerColumnsElements.length; j++) {
        if (parseInt(config.footerColumnsElements[j]["column"]) === i) {
          columns_aux[i].push(config.footerColumnsElements[j]);
        }
      };
      columns_aux[i].sort((a, b) => a.order - b.order);
      columnsArray.push(columns_aux);
    }
    setColumnsConfig(columnsArray);
  }, [])

  return (
    <AuthenticatorComponentStyleWrapper
      propsObject={config["footerStyle"]}
      objectName="footerStyle"
      edition={edition}
    >
      {columnsConfig.map((columns, idxCol) => {
        <AuthenticatorComponentStyleWrapper
          propsObject={config["footerStyle"]}
          objectName={`footerColumn${idxCol}`}
          edition={edition}
        >
          {
            columns.map((element, idxRow) => {
              let isImg = element.imageUrl !== undefined && element.imageUrl !== null && element.imageUrl !== ""
              return (
                <AuthenticatorComponentStyleWrapper
                  propsObject={element}
                  objectName={`footerColumn${idxCol}ElemntStyle${idxRow}`}
                  edition={edition}
                >
                  {isImg
                    ? <img src={element.imageUrl} />
                    : element.textValue
                  }
                </AuthenticatorComponentStyleWrapper>
              )
            })
          }
        </AuthenticatorComponentStyleWrapper>
      })
      }
    </AuthenticatorComponentStyleWrapper>
  );
}

export default AuthenticatorFooter;
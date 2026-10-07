#!/bin/sh

echo "iniciando servicio"
basePath=$(pwd)

if [ ! -f "$basePath/.env" ]; then
    echo "No existe archivo de variables de entorno."
    exit 1
fi

source .env
echo "debug container $DEBUG_CONTAINER"
echo "debug app $DEBUG_APP"
echo "port $PORT_DEPLOY"
cd appDashboards

currentDirectory=$(pwd)
proxyName=$NAME_CONTAINER_APP
if [ "$DEBUG_CONTAINER" == "true" ]; then
    echo "entrando a modo de depuracion del contenedor"
    sleep 60m
fi
      
if [ ! -d "$currentDirectory/node_modules" ]; then
    echo "No existen la carpeta de modulos del proyecto."
    echo "instalando dependencias"
    npm i --force
fi

if [ ! -f "$currentDirectory/next.config.js" ]; then
    echo "creando el archivo next.config.js"
    echo "const isProd = process.env.NODE_ENV === 'production'" > next.config.js
    echo "module.exports = {" >> next.config.js
    echo "	basePath: isProd ? '/$proxyName' : '/$proxyName'," >> next.config.js
    echo "	transpilePackages: ['@mui/x-data-grid', '@creangel/ifindit-ui', 'react-spinners']," >> next.config.js
    echo "	env: {" >> next.config.js
    echo "		staticPrefix: isProd ? '/$proxyName' : '/$proxyName'," >> next.config.js
    echo "	}," >> next.config.js
    echo "	compiler: {" >> next.config.js
    echo "		removeConsole: isProd ? true : false," >> next.config.js
    echo "	}" >> next.config.js
    echo "}" >> next.config.js
    rm -rf .next
fi 

if [ "$DEBUG_APP" == "false" ]; then
    echo "iniciando el servidor de produccion"
    rm -rf .next
    rm -rf .package-lock.json
    echo "run build"
    npm run build
    echo "run start"
    npm run start
else
    echo "iniciando el servidor de desarrollo"
    npm run dev
fi
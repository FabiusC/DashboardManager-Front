export default class AuthAdapter {

    checkGroupObject(groupObject) {
        return groupObject.id !== undefined && groupObject.name !== undefined;
    }

    checkGroupObjectList(groupList) {
        if (groupList !== undefined && Array.isArray(groupList)) {
            return groupList.every((group) => {
                return this.checkGroupObject(group);
            });
        }
        return false;
    }

    adaptGroupObject(groupObject){
        return { 
            "id": groupObject.id, 
            "name": groupObject.name, 
            "organization": groupObject.organization, 
            "rol": groupObject.rol
        }
    }

    adaptGroupObjectList(groupObject){
        return groupObject.map((group) => {
            return this.adaptGroupObject(group); 
        })
    }

    checkUser(userObject){
        return userObject.id !== undefined && userObject.username !== undefined && userObject.email !== undefined; 
    }

    checkUsersList(userList) {
        if (userList !== undefined && Array.isArray(userList)) {
            return userList.every((group) => {
                return this.checkUser(group);
            });
        }
        return false;
    }

    checkUsersInfo(userList) {
        if (userList !== undefined && typeof userList !== 'object') {
            return true
        }
        if (userList.id !== undefined && userList.username !== undefined && userList.email !== undefined){
            return true
        }
        return false;
    }

    adaptUsersObject(userObject){
        return { 
            "id": userObject.id, 
            "permissions": userObject.permissions,
            "username": userObject.username, 
            "email": userObject.email, 
            "organization_id": userObject.organization_id,
            "created_at": userObject.created_at, 
            "edited_at": userObject.edited_at, 
            "ldap": userObject.ldap, 
            "active": userObject.active, 
        }   
    }

    adaptUsersList(userObject){
        return userObject.map((user) => {
            return this.adaptUsersObject(user); 
        })
    }

    checkRolUser(rolObject){
        return rolObject.id !== undefined && rolObject.type !== undefined && rolObject.permission_id !== undefined
    }

    checkRolList(rolList) {
        if (rolList !== undefined && Array.isArray(rolList)) {
            return rolList.every((rol) => {
                return this.checkRolUser(rol);
            });
        }
        return false;
    }

    adaptRolObject(rolObject){
        return { 
            "id": rolObject.id,
            "type": rolObject.type,
            "value": rolObject.value,
            "description": rolObject.description,
            "permission_id": rolObject.permission_id
        }   
    }

    adaptRolList(rolObject){
        return rolObject.map((rol) => {
            return this.adaptRolObject(rol); 
        })
    }

    checkMasterSources(sourceObject){
        return sourceObject.id !== undefined && sourceObject.name !== undefined && sourceObject.num_fields !== undefined
    }

    checkMasterSourcesList(sourcesList) {
        if (sourcesList !== undefined && Array.isArray(sourcesList)) {
            return sourcesList.every((source) => {
                return this.checkMasterSources(source);
            });
        }
        return false;
    }

    adaptMasterSource(sourceObject){
        return { 
            "app_destination": sourceObject.app_destination,
            "created_at": sourceObject.created_at,
            "description": sourceObject.description,
            "edited_at": sourceObject.edited_at,
            "id": sourceObject.id, 
            "instance_id": sourceObject.instance_id,
            "name": sourceObject.name,
            "num_fields": sourceObject.num_fields,
            "records_count": sourceObject.records_count || sourceObject.num_records,
            "origin": sourceObject.origin, 
            "schema": sourceObject.schema
        }   
    }

    adaptMasterSourcesList(sourceObject){
        return sourceObject.map((source) => {
            return this.adaptMasterSource(source); 
        })
    }

    checkLogsUser(logObject){
        return logObject["@timestamp"] !== undefined && logObject.group !== undefined && logObject.action !== undefined
    }

    checkLogsUserList(logsList) {
        if (logsList !== undefined && Array.isArray(logsList)) {
            return logsList.every((log) => {
                return this.checkLogsUser(log);
            });
        }
        return false;
    }

    adaptLogsUser(logObject){
        return { 
            "@timestamp":  logObject["@timestamp"],
            "action":  logObject.action,
            "action_id":  logObject.action_id,
            "application":  logObject.application,
            "day":  logObject.day,
            "day_week":  logObject.day_week,
            "group":  logObject.group,
            "group_id":  logObject.group_id,
            "object_id": logObject.object_id,
            "object_type":  logObject.object_type,
            "organization":  logObject.organization,
            "result":  logObject.result,
            "status":  logObject.status,
            "month":  logObject.month,
            "year": logObject.year
        }   
    }

    adaptLogsUserList(logObject){
        return logObject.map((log) => {
            return this.adaptLogsUser(log); 
        })
    }

    checkTypeConnection(typeConnection){        
        return typeConnection.name !== undefined && typeConnection.alias !== undefined && typeConnection.description !== undefined; 
    }

    checkTypesConnectionList(typesList){
        if (typesList !== undefined && Array.isArray(typesList)) {
            return typesList.every((Connection) => {
                return this.checkTypeConnection(Connection);
            });
        }
        return false;
    }

    adaptTypeConnection(typeConnection){
        return { 
            "name":  typeConnection.name,
            "alias":  typeConnection.alias,
            "description":  typeConnection.description,
            "created_at": new Date(Connection.created_at).toLocaleString(),
            "edited_at": new Date(Connection.edited_at).toLocaleString(),
        }   
    }

    adaptTypeConnectionList(typesList){
        return typesList.map((typesList) => {
            return this.adaptTypeConnection(typesList); 
        })
    }
    
    checkConnection(Connection){        
        return Connection.id !== undefined && Connection.name !== undefined && Connection.created_at !== undefined && Connection.edited_at !== undefined &&  Connection.user_creator_name !== undefined && Connection.user_editor_name !== undefined
    }
    
    checkConnectionList(ConnectionList){
        if (ConnectionList !== undefined && Array.isArray(ConnectionList)) {
            return ConnectionList.every((Connection) => {
                return this.checkConnection(Connection);
            });
        }
        return false;
    }

    adaptConnection(Connection){
        return {
            "id": Connection.id,
            "name": Connection.name, 
            "created_at": new Date(Connection.created_at).toLocaleString(),
            "edited_at": new Date(Connection.edited_at).toLocaleString(),
            "user_creator_name": Connection.user_creator_name,
            "user_editor_name": Connection.user_editor_name,
        }   
    }

    adaptConnectionList(ConnectionList){
        return ConnectionList.map((Connection) => {
            return this.adaptConnection(Connection); 
        })
    }

    checkTypeConnection(typeConnection){        
        return typeConnection.name !== undefined && typeConnection.alias !== undefined && typeConnection.description !== undefined; 
    }

    checkTypesConnectionList(typesList){
        if (typesList !== undefined && Array.isArray(typesList)) {
            return typesList.every((Connection) => {
                return this.checkTypeConnection(Connection);
            });
        }
        return false;
    }

    adaptTypeConnection(typeConnection){
        return { 
            "name":  typeConnection.name,
            "alias":  typeConnection.alias,
            "description":  typeConnection.description,
            "application_type":  typeConnection.application_type
        }   
    }

    adaptTypeConnectionList(typesList){
        return typesList.map((typesList) => {
            return this.adaptTypeConnection(typesList); 
        })
    }
    
    checkConnection(Connection){        
        return Connection.id !== undefined && Connection.name !== undefined && Connection.created_at !== undefined && Connection.edited_at !== undefined &&  Connection.user_creator_name !== undefined && Connection.user_editor_name !== undefined && Connection.type_connection_id !== undefined
    }
    
    checkConnectionList(ConnectionList){
        if (ConnectionList !== undefined && Array.isArray(ConnectionList)) {
            return ConnectionList.every((Connection) => {
                return this.checkConnection(Connection);
            });
        }
        return false;
    }

    adaptConnection(Connection){
        return {
            "id": Connection.id,
            "name": Connection.name,
            "type_connection_id": Connection.type_connection_id,
            "created_at": new Date(Connection.created_at).toLocaleString(),
            "edited_at": new Date(Connection.edited_at).toLocaleString(),
            "user_creator_name": Connection.user_creator_name,
            "user_editor_name": Connection.user_editor_name,
        }   
    }

    adaptConnectionList(ConnectionList){
        return ConnectionList.map((Connection) => {
            return this.adaptConnection(Connection); 
        })
    }
}



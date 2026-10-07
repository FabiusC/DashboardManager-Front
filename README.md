# IFindIT Auth Manager

IFindIT Auth Manager es una herramienta de almacenamiento y búsqueda de fuentes de datos. Con esta herramienta, la organización puede acceder fácil y rápidamente a sus datos.

La plataforma cuenta con los siguientes módulos de trabajo:

- Módulo de archivos
- Módulo de configuración de infraestructura
- Módulo de fuente de datos
- Módulo de administración de tareas
- Módulo del catálogo
- Módulo de autenticación

## Definición de casos de uso según módulos

### Autenticación

1. Crear, editar, eliminar y listar usuarios.

2. Vincular o desvincular usuarios.

3. Crear, editar y eliminar grupos.

4. Conexión LDAP

5. Crear, editar, eliminar y visualizar organización

* Limitar cantidad de usuarios por roles de administración y usuarios. ADMIN 1 POR ORGANIZACIÓN y ADMINGRUPO SOLO 1 POR GRUPO. 

#### Permisos según los roles

| Funcionalidad                           | admin_creangel | admin         | admin_group   | user_group    | user          | no auth user  |
| -------------                           | -------------  | ------------- | ------------- | ------------- | ------------- | ------------- |
| Crear usuario                           | x              | x             | x             |               |               |               |
| Editar usuarios                         | x              | x             | x             |               |               |               |
| Eliminar usuarios                       | x              | x             | x             |               |               |               |
| Listar usuarios                         | x              | x             | x             |               |               |               |
| Vincular usuario a grupo                | x              | x             | x             |               |               |               |
| Desvincular usuario a grupo             | x              | x             | x             |               |               |               |
| Crear grupo                             | x              | x             |               |               |               |               |
| Editar grupo                            | x              | x             |               |               |               |               |
| Listar grupo                            | x              | x             |               |               |               |               |
| Eliminar grupo                          | x              | x             |               |               |               |               |
| Crear Organización                      | x              |               |               |               |               |               |
| Eliminar Organización                   | x              |               |               |               |               |               |
| Editar Organización                     | x              |               |               |               |               |               |
| Listar Organización                     | x              |               |               |               |               |               |
| Autenticar                              | x              |  x            | x             | x             | x             |               |
| Desautenticar                           | x              |  x            | x             | x             | x             |               |
| Cerrar sesiones                         | x              |  x            |               |               |               |               |
| Crear objetos ACL                       | x              |  x            | x             | x             |               |               |
| Borrar objetos ACL                      | x              |  x            | x             | x             |               |               |
| Editar permisos objeto y usuario de ACL | x              |  x            | x             | x             |               |               |
| Listar objetos ACL                      | x              |  x            | x             | x             | x             | x             |
| Crear tipo de objeto                    | x              |               |               |               |               |               |
| Listar tipo de objeto                   | x              |               |               |               |               |               |
| Crear logs de autenticación             | x              |  x            | x             | x             | x             | x             |
| Crear logs de acción                    | x              |  x            | x             | x             |               |               |
| Ver logs autenticación                  | x              |  x            |               |               |               |               |
| Ver logs acciones                       | x              |  x            |               |               |               |               |
| Agregar LDAP                            | x              |  x            |               |               |               |               |
| Editar LDAP                             | x              |  x            |               |               |               |               |
| Eliminar LDAP                           | x              |  x            |               |               |               |               |
| Listar LDAP                             | x              |  x            |               |               |               |               |

## Seguridad

| Rol            | Nivel de acceso | Nombre público |
| -------------  | -------------   | -------------  | 
| admin_creangel | 10              | super_user     | 
| admin          | 8               | administrator  |
| admin_group    | 6               | admin_group    |
| user_group     |                 |                |
| user           |                 |                |
| no auth user   |                 |                |

Data engineer (load the data to the catalog)
Steward (manager and have access to the register data in the catalog)
Consumer (analysis the information)

## Alcance de la primera versión

- Auntenticación y permisos de los usuarios

| Funcionalidad                           | admin_creangel | admin         | admin_group   | user_group    | user          | no auth user  |
| -------------                           | -------------  | ------------- | ------------- | ------------- | ------------- | ------------- |
| Crear usuario                           | x              | x             | x             |               |               |               |
| Listar usuarios                         | x              | x             | x             |               |               |               |
| Vincular usuario a grupo                | x              | x             | x             |               |               |               |
| Desvincular usuario a grupo             | x              | x             | x             |               |               |               |
| Crear grupo                             | x              | x             |               |               |               |               |
| Listar grupo                            | x              | x             |               |               |               |               |
| Eliminar grupo                          | x              | x             |               |               |               |               |
| Autenticar                              | x              | x             | x             | x             | x             |               |
| Desautenticar                           | x              | x             | x             | x             | x             |               |
| Crear objetos ACL                       | x              | x             | x             | x             |               |               |
| Borrar objetos ACL                      | x              | x             | x             | x             |               |               |
| Editar permisos objeto y usuario de ACL | x              | x             | x             | x             |               |               |
| Listar objetos ACL                      | x              | x             | x             | x             | x             | x             |
| Crear tipo de objeto                    | x              |               |               |               |               |               |
| Listar tipo de objeto                   | x              |               |               |               |               |               |

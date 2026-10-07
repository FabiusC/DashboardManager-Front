import axios from "axios";
import { AuthInterceptor } from "./authInterceptor";
import { removeUserInfo, removeGroup, removePermission, clearEnableActions, pushNotification } from "../redux/actions";
import jwtDecode from 'jwt-decode';
import Router from "next/router";

let store

export const injectStore = (_store) => {
    store = _store;
}

// const authService = {
//     isLoggedIn: () => {
//         const token = store.getState().auth.token;
//         return token !== undefined && typeof token === 'string' && token !== '';
//     },
//     getToken: () => store.getState().auth.token,
//     isTokenExpired: (token) => {
//         try {
//             const decodedToken = jwtDecode(token);
//             const expirationDate = decodedToken.exp * 1000;
//             return Date.now() > expirationDate;
//         } catch (error) {
//             console.error('Error decoding JWT:', error);
//             return true;
//         }
//     }
// };

// class AuthInterceptor {
//     bannedEndpoints = [
//         /^http.*\/user\/login$/,
//         /^http.*\/organization\/info\/.*$/,
//         /^http.*\/organization\/_search$/,
//         /^((?!\/api\/v1\/).)*$/
//     ];

//     constructor(authService) {
//         this.authService = authService;
//     }

//     intercept = (request) => {
//         if (this.authService.isLoggedIn() && !this.bannedEndpoints.some(urlRegex => request.url.match(urlRegex))) {
//             const token = this.authService.getToken();
//             if (this.authService.isTokenExpired(token)) {
//                 store.dispatch(removeUserInfo());
//                 store.dispatch(removeGroup());
//                 store.dispatch(removePermission());
//                 store.dispatch(clearEnableActions());
//                 Router.push('/login/exec?forward=/security/groups');
//                 return Promise.reject(new Error('Token expired'));
//             }
//             request.headers.Authorization = `Bearer ${token}`;
//         }
//         return request;
//     }
// }

// export const authInterceptorInstance = new AuthInterceptor(authService);

// axios.interceptors.request.use(
//     (request) => authInterceptorInstance.intercept(request),
//     (error) => Promise.reject(error)
// );

// axios.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response) {
//             const { status, data } = error.response;
//             if (status === 401) {
//                 store.dispatch(removeUserInfo());
//                 store.dispatch(removeGroup());
//                 store.dispatch(removePermission());
//                 store.dispatch(clearEnableActions());
//                 Router.push('/login/exec?forward=/security/groups');
//             } else if (status >= 400 && status < 500) {
//                 store.dispatch(pushNotification({
//                     msg: `Error: ${data.message || 'Request failed'}`,
//                     status: 'err'
//                 }));
//             }
//         }
//         return Promise.reject(error);
//     }
// );
const authService = {
    isLoggedIn: () => {
        const token = store.getState().auth.token;
        return token !== undefined && typeof token === 'string' && token !== '';
    },
    getToken: () => store.getState().auth.token,
    isTokenExpired: (token) => {
        try {
            const decodedToken = jwtDecode(token);
            const expirationDate = decodedToken.exp * 1000;
            return Date.now() > expirationDate;
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return true;
        }
    }
};

export function subscribeAuthInterceptor() {
    

    axios.interceptors.request.use(
        (request) => {
            if (authService.isLoggedIn() && !authInterceptorInstance.bannedEndpoints.some(urlRegex => request.url.match(urlRegex))) {
                const token = authService.getToken();
                if (authService.isTokenExpired(token)) {
                    store.dispatch(removeUserInfo());
                    store.dispatch(removeGroup());
                    store.dispatch(removePermission());
                    store.dispatch(clearEnableActions());
                    Router.push('/login/exec?forward=/home');
                    return Promise.reject(new Error('Token expired'));
                }
                request.headers.Authorization = `Bearer ${token}`;
            }
            return request;
        },
        (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response) {
                const { status, data } = error.response;
                if (status === 401) {
                    if (authService.isLoggedIn()) {
                        store.dispatch(removeUserInfo());
                        store.dispatch(removeGroup());
                        store.dispatch(removePermission());
                        store.dispatch(clearEnableActions());
                        Router.push('/login/exec?forward=/home');
                    } else {
                        store.dispatch(pushNotification({
                            msg: 'No autorizado. El recurso requiere autenticación.',
                            status: 'err'
                        }));
                    }
                } else if (status >= 400 && status < 500) {
                    store.dispatch(pushNotification({
                        msg: `Error: ${data.message || 'Request failed'}`,
                        status: 'err'
                    }));
                }
            }
            return Promise.reject(error);
        }
    );

    return authService;
}

export const authInterceptorInstance = new AuthInterceptor(authService);

// export function subscribeAuthInterceptor() {
//     const authService = {
//         isLoggedIn: () => {
//             const token = store.getState().auth.token;
//             return token !== undefined && typeof token === "string" && token !== "";
//         },
//         getToken: () => store.getState().auth.token
//     };
//     const authInterceptorInstance = new AuthInterceptor(authService);
//     const matcher = (request) => {
//         const shouldSkip = authInterceptorInstance.bannedEndpoints.some(
//             urlRegex => request.url.match(urlRegex) !== null
//         );
//         return !shouldSkip; // Intercept only non-excluded requests
//     };
//     axios.interceptors.request.use(
//         function (request) {
//             return matcher(request)
//                 ? authInterceptorInstance.intercept(request)
//                 : request;
//         },
//         (error) => Promise.reject(error)
//     );
// }

// export function subscribeAuthInterceptor() {
//     const authService = {
//         isLoggedIn: () => {
//             const token = store.getState().auth.token;
//             return token !== undefined && typeof token === "string" && token !== "";
//         },
//         getToken: () => store.getState().auth.token,
//         isTokenExpired: (token) => {
//             try {
//                 const decodedToken = jwtDecode(token);
//                 const expirationDate = decodedToken.exp * 1000;
//                 return Date.now() > expirationDate;
//             } catch (error) {
//                 console.error('Error JWT:', error);
//                 return true;
//             }
//         }
//     };

//     const authInterceptorInstance = new AuthInterceptor(authService);

//     axios.interceptors.request.use(
//         (request) => {
//             if (authService.isLoggedIn() && !authInterceptorInstance.bannedEndpoints.some(urlRegex => request.url.match(urlRegex))) {
//                 const token = authService.getToken();
//                 if (authService.isTokenExpired(token)) {
//                     store.dispatch(removeUserInfo());
//                     store.dispatch(removeGroup());
//                     store.dispatch(removePermission());
//                     store.dispatch(clearEnableActions());
//                     Router.push("/login/exec?forward=/security/groups");
//                     return Promise.reject(new Error('Token expired')); // Interrumpe la solicitud
//                 }
//                 request.headers.Authorization = `Bearer ${token}`;
//             }
//             return request;
//         },
//         (error) => Promise.reject(error)
//     );
//     // const matcher = (request) => {
//     //     const shouldSkip = authInterceptorInstance.bannedEndpoints.some(
//     //         urlRegex => request.url.match(urlRegex) !== null
//     //     );
//     //     return !shouldSkip;
//     // };

//     // axios.interceptors.request.use(
//     //     function (request) {
//     //         if (authService.isLoggedIn()) {
//     //             const token = authService.getToken();
//     //             if (authService.isTokenExpired(token)) {
//     //                 store.dispatch(removeUserInfo());
//     //                 store.dispatch(removeGroup());
//     //                 store.dispatch(removePermission());
//     //                 store.dispatch(clearEnableActions());
//     //                 Router.push("/login/exec?forward=/security/groups"); 
//     //                 return Promise.reject(new Error('Token expired'));
//     //             }
//     //             request.headers.Authorization = `Bearer ${token}`;
//     //         }
//     //         return matcher(request)
//     //             ? authInterceptorInstance.intercept(request)
//     //             : request;
//     //     },
//     //     (error) => Promise.reject(error)
//     // );

//     axios.interceptors.response.use(
//         response => response,
//         (error) => {
//             if (error.response && error.response.status === 401) {
//                 store.dispatch(removeUserInfo());
//                 store.dispatch(removeGroup());
//                 store.dispatch(removePermission());
//                 store.dispatch(clearEnableActions());
//                 Router.push("/login/exec?forward=/security/groups");
//             }
//             return Promise.reject(error);
//         }
//     );
// }

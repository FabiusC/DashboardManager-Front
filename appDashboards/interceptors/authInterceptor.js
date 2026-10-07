import Router from "next/router";

export class AuthInterceptor {
    bannedEndpoints = [
        /^http.*\/user\/login$/,
        /^http.*\/organization\/info\/.*$/,
        /^http.*\/organization\/_search$/,
        /^((?!\/api\/v1\/).)*$/
    ];

    constructor(authService) {
        this.authService = authService;
    }

    intercept = (request) => {
        if (this.authService.isLoggedIn()) {
            const token = this.authService.getToken();
            if (this.authService.isTokenExpired(token)) {
                store.dispatch(removeUserInfo());
                store.dispatch(removePermission());
                store.dispatch(clearEnableActions());
                Router.push('/login/exec?forward=/home');
                return Promise.reject(new Error('Token expired'));
            }
            request.headers.Authorization = `Bearer ${token}`;
        }
        return request;
    }
}
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
    pushNotification,
    addOrganization,
    addUserInfo,
    addPermissions,
    removeUserInfo,
    removePermission,
    setAppId,
    fetchApplicationServicesPublic,
    fetchApplicationServices,
} from "../../redux/actions";
import { generateAuthenticationToken } from "@services/creangelAuthAPI";
import { ResponseAPIAdapter } from "@raiz/adapters/responseAPIAdapter";
import BeatLoader from "react-spinners/BeatLoader";
import { Box, Typography } from "@mui/material";
import { dashboardGeneralRequest } from "@services/dashboardAPI";

const STRIP_QUERY_KEYS = ["rid_crngl", "app_id", "forward"];

function normalizeForward(forward) {
    if (typeof forward !== "string") return "";
    if (!forward.startsWith("/")) return "";
    if (forward.startsWith("/login") || forward.startsWith("/authenticator")) return "";
    return forward;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isTokenActive(token) {
    try {
        const { exp } = jwtDecode(token);
        return typeof exp === "number" && exp * 1000 > Date.now();
    } catch (_) {
        return false;
    }
}

function isDashboardRoute(router) {
    const path = router.asPath || "";
    return /\/dashboard\/[^/?#]+/.test(path);
}

function getDashboardIdFromRouter(router) {
    const path = router.asPath || "";
    const m = path.match(/\/dashboard\/([^/?#]+)/);
    return m?.[1] || "";
}

async function checkDashboardIsPublic(id) {
    try {
        const res = await dashboardGeneralRequest({
            version: "v1",
            typeRequest: "GET",
            nameUrl: "dashboardVisibility",
            dynamicParams: { id },
            useJWT: false,
        });
        if (!res || typeof res !== "object") return null;
        if (res.status && res.status !== "success" && res.status !== "ok") return null;
        const data = res?.data ?? null;
        const isPublic = data?.is_public;
        const isPublished = data?.is_published;
        if (typeof isPublic !== "boolean" || typeof isPublished !== "boolean") return null;
        return isPublic === true && isPublished === true;
    } catch (_) {
        return null;
    }
}

export default function AuthGate({ children }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const apiAdapter = useMemo(() => new ResponseAPIAdapter(), []);
    const user = useSelector((state) => state.user);
    const hasStoredSession = Array.isArray(user) && user.length > 0;
    const sessionToken = hasStoredSession ? user[0]?.userID : null;
    const hasValidSession =
        typeof sessionToken === "string" && sessionToken !== "" && isTokenActive(sessionToken);
    const [busy, setBusy] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const didConsumeRidRef = useRef(false);

    const isExcludedRoute = useMemo(() => {
        const p = router.pathname || "";
        return (
        p.startsWith("/authenticator") ||
        p.startsWith("/login") ||
        p.startsWith("/NotFound") ||
        p.startsWith("/_error")
        );
    }, [router.pathname]);

    useEffect(() => {
        if (!router.isReady) return;
        if (isExcludedRoute) return;

        const { rid_crngl, app_id, forward } = router.query;
        const hasRid = typeof rid_crngl === "string" && rid_crngl !== "";

        const stripAuthParams = () => {
            const cleaned = { ...router.query };
            STRIP_QUERY_KEYS.forEach((k) => delete cleaned[k]);
            router.replace({ pathname: router.pathname, query: cleaned }, undefined, {
                shallow: true,
            });
        };

        const discardStoredSession = () => {
            if (typeof window !== "undefined") {
                localStorage.removeItem("authToken");
            }
            dispatch(removeUserInfo());
            dispatch(removePermission());
        };

        // Sesión con token todavía 
        if (hasValidSession) {
            if (hasRid) stripAuthParams();
            return;
        }

        // Sin sesión válida y con rid entrante:re-autenticación

        if (hasRid) {
            if (didConsumeRidRef.current) return;
            didConsumeRidRef.current = true;

            const forwardPath = normalizeForward(typeof forward === "string" ? forward : "");

            const run = async () => {
                const authErrorMessages = {
                    "Authentication request is invalid":
                    "La solicitud de autenticación no es válida.",
                    "Authentication request expired":
                    "La solicitud de autenticación ha expirado, vuelva a intentarlo.",
                    "Authentication request origin is not valid":
                    "El origen de la solicitud de autenticación no es válido.",
                    "Authentication request already used":
                    "La solicitud de autenticación ya fue utilizada.",
                };

                try {
                    setBusy(true);
                    // vencido: se descarta antes de canjear el rid nuevo.
                    if (hasStoredSession) {
                        discardStoredSession();
                    }

                    if (typeof app_id === "string" && app_id) {
                    dispatch(setAppId(app_id));
                    }

                    const responseLogin = await generateAuthenticationToken(rid_crngl);
                    const [validLogin, responseLoginData] = apiAdapter.checkResponse(responseLogin);

                    const userFriendlyMessage =
                    authErrorMessages?.[responseLoginData?.msg] ||
                    "Error en la autenticación, vuelva a intentarlo.";

                    if (!validLogin) {
                    if (typeof responseLoginData?.msg === "string" && /not found|no existe/i.test(responseLoginData.msg)) {
                        router.replace("/NotFound");
                        return;
                    }
                    dispatch(pushNotification({ msg: userFriendlyMessage, status: "err" }));
                    await sleep(1500);
                    return;
                    }

                    const responseStatus = responseLoginData?.status;
                    const userData = responseLoginData?.data;

                    if (responseStatus !== "success" || !userData?.token_session) {
                    dispatch(pushNotification({ msg: userFriendlyMessage, status: "err" }));
                    return;
                    }

                    const tokenSession = userData.token_session;
                    const decoded = jwtDecode(tokenSession);

                    dispatch(
                    addUserInfo({
                        userID: tokenSession,
                        userData: decoded,
                    }),
                    );
                    dispatch(addPermissions(tokenSession));

                    if (typeof app_id === "string" && app_id) {
                        dispatch(fetchApplicationServices(app_id));
                    }

                    if (decoded?.organization_id) {
                    dispatch(addOrganization(decoded.organization_id));
                    }

                    if (typeof window !== "undefined") {
                    localStorage.setItem("authToken", tokenSession);
                    }

                    const cleaned = { ...router.query };
                    STRIP_QUERY_KEYS.forEach((k) => delete cleaned[k]);
                    await router.replace({ pathname: router.pathname, query: cleaned }, undefined, {
                    shallow: true,
                    });

                    if (forwardPath) {
                    router.replace(forwardPath);
                    }
                } catch (e) {
                    if (e?.response?.status === 404) {
                        router.replace("/NotFound");
                        return;
                    }
                    dispatch(
                    pushNotification({
                        msg: "Error en la autenticación, vuelva a intentarlo.",
                        status: "err",
                    }),
                    );
                } finally {
                    setBusy(false);
                }
            };

            run();
            return;
        }

        if (hasStoredSession) {
            // Sesión persistida con token vencido y sin rid para renovarla
            discardStoredSession();
            return;
        }

        if (isDashboardRoute(router)) {
            const id = getDashboardIdFromRouter(router);
            if (id) {
                (async () => {
                    try {
                        const appIdFromQuery = typeof app_id === "string" ? app_id : "";
                        if (appIdFromQuery) {
                            dispatch(setAppId(appIdFromQuery));
                            const res = await dispatch(fetchApplicationServicesPublic(appIdFromQuery));
                            if (res?.notFound) {
                                router.replace("/NotFound");
                                return;
                            }
                        }
                        const isPublic = await checkDashboardIsPublic(id);
                        if (isPublic === true) {
                            return;
                        }
                        if (isPublic === null) {
                            return;
                        }
                    } catch (e) {
                    }
                    if (typeof window !== "undefined") {
                        const staticPrefix = process.env.staticPrefix || "";
                        const forwardTarget = router.asPath || "/home";
                        setRedirecting(true);
                        window.location.href = `${window.location.origin}${staticPrefix}/login/exec?forward=${encodeURIComponent(forwardTarget)}`;
                    }
                })();
                return;
            }
        }

        if (typeof window !== "undefined") {
            const staticPrefix = process.env.staticPrefix || "";
            const forwardTarget = router.asPath || "/home";
            setRedirecting(true);
            window.location.href = `${window.location.origin}${staticPrefix}/login/exec?forward=${encodeURIComponent(forwardTarget)}`;
        }
    }, [
        router.isReady,
        router.query,
        router.pathname,
        hasStoredSession,
        hasValidSession,
        isExcludedRoute,
        dispatch,
        apiAdapter,
    ]);

    if (busy) {
        const staticPrefix = process.env.staticPrefix;

        return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            backgroundColor="F3F3F3"
        >
            <img
            src={staticPrefix + "/img/logocreangel.png"}
            height="60"
            alt="logo creangel"
            />

            <BeatLoader size={20} color="#0C419A" />

            <Typography
            variant="h4"
            color="textPrimary"
            align="center"
            style={{ marginTop: "20px" }}
            >
            Cargando...
            </Typography>
        </Box>
        );
    }

    if (redirecting) {
        const staticPrefix = process.env.staticPrefix;

        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                backgroundColor="F3F3F3"
            >
                <img
                    src={staticPrefix + "/img/logocreangel.png"}
                    height="60"
                    alt="logo creangel"
                />

                <BeatLoader size={20} color="#0C419A" />

                <Typography
                    variant="h4"
                    color="textPrimary"
                    align="center"
                    style={{ marginTop: "20px" }}
                >
                    Redirigiendo...
                </Typography>
            </Box>
        );
    }

    return <>{children}</>;
}

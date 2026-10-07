import Head from 'next/head';
import MainBar from '@components/Base/MainBar/index.js';
import Notificator from './Recursive/Notificator';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/router";
import { addOrganization, fetchApplicationServices, fetchApplicationServicesPublic, setAppId } from '../redux/actions';
import { connect, useDispatch, useSelector } from 'react-redux';
import { StyledMain, StyledDrawerHeader } from '@components/Recursive/mui_styled_components';
import { getDimensionsWindowObject } from '../source/dimensions';
import BeatLoader from 'react-spinners/BeatLoader';
import { Box, Typography } from '@mui/material';
import "react-sliding-pane/dist/react-sliding-pane.css";
const mapStateToProps = state => ({
    user: state.user,
    organization: state.organization,
    actions: state.actions,
    bar: state.bar,
    dimensions: state.dimensions,
    dashboardLoading: state.bar?.dashboardLoading ?? false,
});
function Main(props) {
    const staticPrefix = process.env.staticPrefix;
    const drawerwidthmax = (props?.dimensions?.width >= 900 || props?.dimensions?.width === undefined) ? 205 : 200;
    const drawerwidthmin = 55;
    const dispatch = useDispatch();
    const router = useRouter();
    const isDashboardViewerRoute = router.pathname === '/dashboard/[id]' && router.query?.id;
    const isEditorView = router.pathname === '/panelsWorkspace' || router.pathname === '/dashboardsWorkspace';

    const showLateralBar = props.actions && typeof props.actions === 'object' && !Array.isArray(props.actions) && 'ui_lateral_bar' in props.actions;
    const isDesktop = (props?.dimensions?.width ?? 0) >= 900;
    const currentSidebarWidth = (!showLateralBar || !isDesktop) ? 0 : (isDashboardViewerRoute ? 0 : (props.bar?.openBar ? drawerwidthmax : drawerwidthmin));
    const sess_i = (props.user !== 'null') && (props.user !== undefined) && (props.user.length > 0);

    const appId = useSelector(state => state.app?.id);
    const microservices = useSelector(state => state.microservice || []);
    const organizationId = useSelector(state => state.user?.[0]?.userData?.organization_id);
    const [hydrationLoad, setHydrationLoad] = useState(true);
    const [selectedOrganization, setSelectedOrganization] = useState();
    const hasFetchedServicesRef = useRef(false);
    const hasFetchedPublicServicesRef = useRef(false);
    const hasStrippedPublicAppIdRef = useRef(false);
    const lastFetchedServicesAppIdRef = useRef(null);
    const lastFetchedPublicAppIdRef = useRef(null);
    useEffect(() => {
        setHydrationLoad(false);
        if (typeof window !== "undefined") {
            getDimensionsWindowObject(dispatch);
        }
    }, []);
    useEffect(() => {
        if (!sess_i) return;
        if (!organizationId) return;
        setSelectedOrganization(organizationId);
        dispatch(addOrganization(organizationId));
    }, [sess_i, organizationId, dispatch]);
    useEffect(() => {
        if (sess_i && appId && !hasFetchedServicesRef.current) {
            dispatch(fetchApplicationServices(appId));
            hasFetchedServicesRef.current = true;
            lastFetchedServicesAppIdRef.current = appId;
        }
        if (appId && lastFetchedServicesAppIdRef.current && lastFetchedServicesAppIdRef.current !== appId) {
            hasFetchedServicesRef.current = false;
        }
    }, [sess_i, appId, microservices.length, dispatch]);

    useEffect(() => {
        if (sess_i) return;
        if (!isDashboardViewerRoute) return;
        if (!router.isReady) return;

        const appIdFromQuery = typeof router.query?.app_id === "string" ? router.query.app_id : "";
        const appIdFromHash =
            typeof window !== "undefined"
                ? (() => {
                    try {
                        const hash = window.location.hash || "";
                        if (!hash) return "";
                        const h = hash.startsWith("#") ? hash.slice(1) : hash;
                        const params = new URLSearchParams(h);
                        return params.get("app_id") || "";
                    } catch (_) {
                        return "";
                    }
                })()
                : "";
        const appIdFromStorage =
            typeof window !== "undefined"
                ? (sessionStorage.getItem("public_app_id") || "")
                : "";
        const effectiveAppId = appIdFromQuery || appIdFromHash || appIdFromStorage;
        if (!effectiveAppId) return;

        if (typeof window !== "undefined" && effectiveAppId) {
            sessionStorage.setItem("public_app_id", effectiveAppId);
        }

        if (!appId) {
            dispatch(setAppId(effectiveAppId));
        }

        if (!hasFetchedPublicServicesRef.current) {
            (async () => {
                const res = await dispatch(fetchApplicationServicesPublic(effectiveAppId));
                hasFetchedPublicServicesRef.current = true;
                lastFetchedPublicAppIdRef.current = effectiveAppId;

                if (res?.notFound) {
                    router.replace("/NotFound");
                }
            })();
        }

        if ((appIdFromQuery || (!appIdFromHash && effectiveAppId)) && !hasStrippedPublicAppIdRef.current) {
            const cleaned = { ...(router.query || {}) };
            delete cleaned.app_id;
            hasStrippedPublicAppIdRef.current = true;
            const nextUrl = `${window.location.origin}${process.env.staticPrefix || ""}/dashboard/${router.query?.id || ""}#app_id=${encodeURIComponent(effectiveAppId)}`;
            router.replace({ pathname: router.pathname, query: cleaned }, undefined, { shallow: true });
            if (typeof window !== "undefined") {
                window.history.replaceState(window.history.state, "", nextUrl);
            }
        }

        if (lastFetchedPublicAppIdRef.current && lastFetchedPublicAppIdRef.current !== effectiveAppId) {
            hasFetchedPublicServicesRef.current = false;
            hasStrippedPublicAppIdRef.current = false;
        }
    }, [sess_i, isDashboardViewerRoute, router.isReady, router.query, appId, microservices.length, dispatch]);
    if (sess_i) {
        if (hydrationLoad) {
            return (
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    height="100vh"
                    backgroundColor="F3F3F3"
                >
                    <img src={staticPrefix + "/img/logocreangel.png"} height="60" alt="logo creangel" />
                    <BeatLoader size={20} color='#0C419A' />
                    <Typography variant="h4" color="textPrimary" align="center" style={{ marginTop: '20px' }}>
                        Cargando...
                    </Typography>
                    <Notificator />
                </Box>
            );
        } else {
            return (
                <>
                    <Head>
                        <title>IFindIT</title>
                    </Head>
                    <div id="admin_app_container">
                        <div className="main_container" >
                            <MainBar
                                drawerwidthmax={drawerwidthmax}
                                drawerwidthmin={drawerwidthmin}
                                organization={selectedOrganization}
                                isEditorView={isEditorView}
                            />
                            <StyledMain
                                style={{
                                    justifyItems: 'center',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    marginLeft: isDashboardViewerRoute ? 0 : currentSidebarWidth,
                                    width: `calc(100% - ${currentSidebarWidth}px)`,
                                    maxWidth: `calc(100% - ${currentSidebarWidth}px)`,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                }}
                            >
                                {!isDashboardViewerRoute && !isEditorView && <StyledDrawerHeader />}
                                {props.children}
                            </StyledMain>
                        </div>
                        <Notificator />
                    </div>
                </>
            );
        }
    } else {
        if (isDashboardViewerRoute) {
            return (
                <>
                    <Head>
                        <title>IFindIT</title>
                    </Head>
                    {props.children}
                    <Notificator />
                </>
            );
        }
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                backgroundColor="F3F3F3"
            >
                <img src={staticPrefix + "/img/logocreangel.png"} height="60" alt="logo creangel" />
                <BeatLoader size={20} color='#0C419A' />
                <Typography variant="h4" color="textPrimary" align="center" style={{ marginTop: '20px' }}>
                    Cargando...
                </Typography>
                <Notificator />

            </Box>
        );
    }
}

export default connect(mapStateToProps)(Main);

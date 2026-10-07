/*
 * MainBar: layout with sidebar (full height) and header (content area only).
 * Single toggle lives in the sidebar; no duplicate buttons in the header.
 */
import {
  pushNotification,
  setEnableAction,
  stateMainMenu,
  setSelectedOptionBar,
} from "@redux/actions";
import { connect, useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Logout from "@mui/icons-material/Logout";
import StarBorder from "@mui/icons-material/StarBorder";
import {
  getUserLogout,
  getAvailableEnableActions,
} from "@services/creangelAuthAPI";
import {
  validatorAPIBasicParameters,
  handleRequestErrorNotification,
} from "@source/validators";
import { lateralBarOptions } from "@source/appModules";
import MainBarHeader from "./MainBarHeader";
import MainBarSidebar from "./MainBarSidebar";
import MainBarSidebarMobile from "./MainBarSidebarMobile";

const UI_LATERAL_BAR_ACTION = "ui_lateral_bar";

function findOptionByPath(options, path, openBar) {
  for (const option of options) {
    if (path.includes(option.handleFunction)) return option.id;
    if (option.subOptions) {
      const matched = findOptionByPath(option.subOptions, path, openBar);
      if (matched) return openBar ? matched : option.id;
    }
  }
  return null;
}

function MainBar(props) {
  if (!props.user || props.user === "null" || props.user.length === 0)
    return null;

  const [organizationInfo] = props.organization;
  const [stateDisplayOptions, setStateDisplayOptions] = useState({});
  const selectedOption = useSelector((s) => s.bar?.selectedOptionBar);
  const appId = useSelector((s) => s.app?.id ?? null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { pathname } = router;
  const staticPrefix = process.env.staticPrefix;

  const userOptions = [
    {
      id: "license",
      title: "Licencia",
      icon: <StarBorder className="color_body_text" fontSize="small" />,
      handleFunction: "about",
    },
    {
      id: "logout",
      title: "Cerrar sesión",
      icon: <Logout className="color_body_text" fontSize="small" />,
      handleFunction: "handleLogout",
    },
  ];

  const isDashboardViewerRoute =
    pathname === "/dashboard/[id]" && router.query?.id;
  const isEditorView = props.isEditorView === true;
  const hasActions =
    props.actions &&
    typeof props.actions === "object" &&
    !Array.isArray(props.actions) &&
    Object.keys(props.actions).length > 0;
  const showLateralBar =
    props.actions &&
    typeof props.actions === "object" &&
    !Array.isArray(props.actions) &&
    UI_LATERAL_BAR_ACTION in props.actions;
  const isDesktop = (props?.dimensions?.width ?? 0) >= 900;
  const currentSidebarWidth =
    !isDashboardViewerRoute && showLateralBar && isDesktop
      ? props.bar.openBar
        ? props.drawerwidthmax
        : props.drawerwidthmin
      : 0;

  useEffect(() => {
    if (
      !hasActions &&
      props.actions &&
      typeof props.actions === "object" &&
      !Array.isArray(props.actions) &&
      pathname !== "/products"
    ) {
      router.replace("/products");
    }
  }, [hasActions, props.actions, pathname, router]);

  useEffect(() => {
    dispatch(
      setSelectedOptionBar(
        findOptionByPath(lateralBarOptions, pathname, props?.bar?.openBar),
      ),
    );
  }, [pathname, props?.bar?.openBar, dispatch]);

  useEffect(() => {
    setStateDisplayOptions(props?.bar?.modules ?? {});
  }, [props?.bar?.modules, selectedOption]);

  useEffect(() => {
    if (props?.permissions != null && props?.permissions?.length !== 0)
      handleGetApplicationPermissions();
  }, [props?.permissions]);

  const handleDrawerOpen = () =>
    dispatch(stateMainMenu({ ...props.bar, openBar: true }));
  const handleDrawerClose = () =>
    dispatch(stateMainMenu({ ...props.bar, openBar: false }));

  const handleOpenDisplayOption = (e, opId) => {
    const next = { ...props.bar, openBar: true };
    next.modules = {
      ...next.modules,
      [opId]: { ...next.modules[opId], state: !next.modules[opId]?.state },
    };
    dispatch(stateMainMenu(next));
  };

  const handleOpenUncollapse = (e, opId) => {
    const next = { ...props.bar, openBar: true };
    next.modules = {
      ...next.modules,
      [opId]: { ...next.modules[opId], state: true },
    };
    dispatch(stateMainMenu(next));
  };

  const handleNavigate = (e, handleName) => {
    if (handleName === "handleLogout") handleCloseSession(props.user[0]);
    else router.push("/" + handleName);
  };

  const handleCloseSession = async (userSession) => {
    const requestHeader = {
      Authorization: "Bearer " + userSession.userID,
      "Content-Type": "application/json",
    };
    const responseLogout = await getUserLogout(requestHeader);
    const [valid, content] = validatorAPIBasicParameters(
      responseLogout,
      props.user[0]?.userData,
      dispatch,
    );
    handleRequestErrorNotification(
      valid,
      content,
      dispatch,
      {
        success: "Cierre de sesión exitoso.",
        err: "No se pudo finalizar el proceso de cierre de sesión en el servidor.",
        invalidResponse:
          "La respuesta del servidor para cerrar sesión no es válida.",
      },
      { success: () => {}, err: () => {}, invalidResponse: () => {} },
    );
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace(`${window.location.origin}/`);
  };

  const handleGetApplicationPermissions = async () => {
    const applicationName = process.env.NEXT_PUBLIC_APPLICATION_NAME;
    if (!applicationName) {
        dispatch(pushNotification({ msg: 'No ha sido configurado un nombre de aplicación para el servicio de autorización.', status: 'err' }));
        return null;
    }
    if (!props.permissions?.length) {
        dispatch(pushNotification({ msg: 'No se ha podido obtener la información del grupo del usuario.', status: 'err' }));
        return null;
    }
    if (!props?.user?.length || !props?.user[0]?.userID) {
        dispatch(pushNotification({ msg: 'No se ha podido obtener la información del usuario.', status: 'err' }));
        return null;
    }
    const response = await getAvailableEnableActions({ is_app: true, application_id: appId }, { Authorization: `Bearer ${props.user[0]?.userID}` });
    const [valid, responseData] = validatorAPIBasicParameters(response, props.user[0]?.userData, dispatch);
    if (!valid) {
        dispatch(pushNotification({ msg: 'El servicio de autorización no esta habilitado.', status: 'err' }));
        return null;
    }
    if (responseData?.status === 'err') {
        dispatch(pushNotification({ msg: 'No fue posible obtener la información de permisos para este usuario', status: 'err', silent: true }));
        return null;
    }
    if (responseData?.data?.length === 0) dispatch(pushNotification({ msg: 'El usuario no posee acciones habilitadas.', status: 'err' }));
    const availableActionsJSON = {};
    (responseData?.data ?? []).forEach((a) => (availableActionsJSON[a.name] = a));
    dispatch(setEnableAction(availableActionsJSON));
  };

  if (props.user.length === 0) return <>Cargando información del usuario</>;

  const hasNavOptions = Object.keys(stateDisplayOptions).length > 0;

  return (
    <>
      {!isDashboardViewerRoute && !isEditorView && (
        <MainBarHeader
          open={currentSidebarWidth > 0}
          drawerWidth={currentSidebarWidth}
          organizationInfo={organizationInfo}
          user={props.user}
          userOptions={userOptions}
          onUserMenuAction={handleNavigate}
        />
      )}
      {!isDashboardViewerRoute &&
        hasNavOptions &&
        showLateralBar &&
        isDesktop && (
          <MainBarSidebar
            open={props.bar.openBar}
            drawerwidthmax={props.drawerwidthmax}
            drawerwidthmin={props.drawerwidthmin}
            stateDisplayOptions={stateDisplayOptions}
            selectedOption={selectedOption}
            actions={props.actions}
            onDrawerOpen={handleDrawerOpen}
            onDrawerClose={handleDrawerClose}
            onOpenDisplayOption={handleOpenDisplayOption}
            onOpenUncollapse={handleOpenUncollapse}
            onNavigate={handleNavigate}
            options={lateralBarOptions}
          />
        )}
      {!isDashboardViewerRoute &&
        hasNavOptions &&
        showLateralBar &&
        !isDesktop && (
          <MainBarSidebarMobile
            open={props.bar.openBar}
            onDrawerClose={handleDrawerClose}
            stateDisplayOptions={stateDisplayOptions}
            selectedOption={selectedOption}
            actions={props.actions}
            onOpenDisplayOption={handleOpenDisplayOption}
            onOpenUncollapse={handleOpenUncollapse}
            onNavigate={handleNavigate}
            options={lateralBarOptions}
          />
        )}
    </>
  );
}

const mapStateToProps = (state) => ({
  user: state.user,
  bar: state.bar,
  actions: state.actions,
  permissions: state.permissions,
  organization: state.organization,
  dimensions: state.dimensions,
});

export default connect(mapStateToProps)(MainBar);

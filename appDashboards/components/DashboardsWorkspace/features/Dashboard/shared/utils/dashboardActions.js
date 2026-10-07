import { dashboardGeneralRequest as generalRequest } from "@services/dashboardAPI";

export const normalizeLayout = (dashboardLayout) => {
  if (!Array.isArray(dashboardLayout)) return [];
  return dashboardLayout.map((item) => {
    const panelId = item.panel_id;
    if (panelId == null) return;
    return {
        id: panelId,
        x: item.x || 0,
        y: item.y || 0,
        w: item.w > 0 ? item.w : 3,
        h: item.h > 0 ? item.h : 2,
        page: item.page || 0,
    };
  }).filter(Boolean);
}

const buildFallbackLayoutFromPanels = (panels = []) => {
  let currentY = 0;
  return (Array.isArray(panels) ? panels : []).map(
    (panel, idx) => {
      const panelId = panel?.id || panel?.panel_id || String(idx);
      const w = Number(panel?.width) > 0 ? Math.min(Number(panel.width), 12) : 12;
      const h = Number(panel?.height) > 0 ? Number(panel.height) : 10;
      const item = { panel_id: panelId, x: 0, y: currentY, w, h, page: 0 };
      currentY += h;
      return item;
  });
};


const layoutHasValidPanelIds = (layout = []) => {
  if (!Array.isArray(layout) || layout.length === 0) return false;
  return layout.every((item) => {
    const rawPanelId = item?.panel_id ?? item?.id;
    const panelId =
      typeof rawPanelId === "object" && rawPanelId !== null
        ? rawPanelId.id
        : rawPanelId;
    return panelId != null && String(panelId).length > 0;
  });
};

export const handleGetPanels = async (panel) => {
  let panelInformation = await generalRequest({
    version: 'v1',
    typeRequest: 'GET',
    nameUrl: 'panelViewMode',
    parameters: {},
    dynamicParams: { "panel_id": panel.id },
  });

  const { setup, query_parameters, ...rest } = panelInformation.data;

  return {
    ...rest,
    queryParameters: query_parameters,
    setUp: setup,
    setUpChanged: {},
    state: {
      isLoading: false,
      hasFields: query_parameters?.query_fields_distribution ? true : false,
      dataError: false,
      fieldConfigurationError: false,
      hasChartType: rest.chart_type?.id ? true : false,
      isLoadingData: rest.chart_type?.id && query_parameters?.query_fields_distribution ? true : false, // Iniciar en true si tiene datos para cargar
      isLoadingFieldsDistribution: false
    }
  };
};
export const validateDashboardSources = async ({ appId, userToken, fieldNames = [] }) => {
  if (!appId || !userToken) return null;
  const body = {
    application_id: String(appId),
    field_names: Array.isArray(fieldNames) ? fieldNames : [],
  };
  return generalRequest({
    version: "v1",
    typeRequest: "POST",
    nameUrl: "validateSources",
    body,
    parameters: {},
    dynamicParams: {},
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });
};

export const handleAddDashboard = async (dashboardInformation,
  setDashboard,
  setLayout,
  setPanels,
  userToken,
  isReadOnly = false
) => {
  const rawPanels = dashboardInformation?.panels;
  const panels =
    Array.isArray(rawPanels) ? rawPanels :
    Array.isArray(rawPanels?.data) ? rawPanels.data :
    Array.isArray(rawPanels?.items) ? rawPanels.items :
    [];
  const providedLayout = dashboardInformation.layout;
  const rawLayout = layoutHasValidPanelIds(providedLayout) ? providedLayout : buildFallbackLayoutFromPanels(panels);
  const layout = normalizeLayout(rawLayout)
  const isPublicViewer = isReadOnly && !userToken;

  if (isPublicViewer) {
    const adaptedPanels = await Promise.all((Array.isArray(panels) ? panels : []).map(async (p) => {
      const chart_type =
        p?.chart_type ||
        (p?.chart_type_id ? { id: p.chart_type_id } : undefined);
      const queryParameters = p?.queryParameters || p?.query_parameters;
      let setUp = p?.setUp || p?.setup;
      // Public setup endpoint for chart parameters
      if (!setUp && p?.id) {
        const setupResp = await generalRequest({
          version: 'v1',
          typeRequest: 'GET',
          nameUrl: 'getChartSetUpPublic',
          dynamicParams: { panel_id: p.id },
          useJWT: false,
        });
        if (setupResp?.status === 'success') {
          setUp = setupResp?.data;
        }
      }
      return {
        ...p,
        ...(chart_type ? { chart_type } : {}),
        ...(queryParameters ? { queryParameters } : {}),
        ...(setUp ? { setUp } : {}),
      };
    }));
    setPanels(adaptedPanels);
  } else {
    //Obtener la información básica de todos los paneles
    const extendedPanels = await Promise.all(
      (Array.isArray(panels) ? panels : []).map(async (panel) => {
        const fullInfo = await handleGetPanels(panel);
        return {
          ...panel,
          ...fullInfo,
        };
      })
    );
    setPanels(extendedPanels);
  }
  setLayout(layout)
  setDashboard((prevDashboard) => ({
    ...prevDashboard,
    ...dashboardInformation,
    settingsChanged: {},
    initialLayout: layout,
    panelsAdded: [],
    functions: {
      handleChangeSettings: (settings) => {
        const walkAndUpdate = (target, updates) => {
          for (const key in updates) {
            if (
              updates[key] &&
              typeof updates[key] === "object" &&
              !Array.isArray(updates[key])
            ) {
              target[key] = walkAndUpdate(target[key] || {}, updates[key]);
            } else {
              target[key] = updates[key];
            }
          }
          return target;
        };

        const mergedSettings = walkAndUpdate(prevDashboard.settingsChanged || {}, settings);

        setDashboard((prev) => ({
          ...prev,
          settingsChanged: mergedSettings,
          functions: prev.functions,
        }));
      },
    },
  }))
};

export const handleExportDashboard = async (dashboard_id, userToken) => {
  const dashboard_export = await generalRequest({
    version: "v1",
    typeRequest: "GET",
    nameUrl: "exportDashboard",
    dynamicParams: { id: dashboard_id },
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (dashboard_export?.status !== "success" || !dashboard_export?.data) {
    throw new Error("No se pudo exportar el dashboard.");
  }

  return dashboard_export;
};

export const handleImportDashboard = async (file, userToken) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await generalRequest({
    version: "v1",
    typeRequest: "POST",
    nameUrl: "importDashboard",
    body: formData,
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    enableNotification: true,
    nameMessage: "dashboard",
  });

  if (response?.status !== "success") {
    throw new Error(response?.msg || "Error al procesar el archivo en el servidor.");
  }

  return response;
};

export const handleCreateDashboardFromJson = async (payload, userToken) => {
  const response = await generalRequest({
    version: "v1",
    typeRequest: "POST",
    nameUrl: "createDashboardFromJson",
    body: payload,
    parameters: {},
    dynamicParams: {},
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    enableNotification: true,
    nameMessage: "tablero",
  });

  if (response?.status !== "success" && response?.status !== "ok") {
    const rawMsg =
      (typeof response?.msg === "string" && response.msg.trim()) ||
      (typeof response?.data?.msg === "string" && response.data.msg.trim()) ||
      "";
    const apiMsg =
      rawMsg.length > 180 || /sqlalchemy|asyncpg|programmingerror|\[SQL:/i.test(rawMsg)
        ? "No se pudo crear el tablero. Intenta de nuevo o contacta soporte."
        : rawMsg;
    throw new Error(apiMsg || "No se pudo crear el tablero desde el archivo importado.");
  }

  return response;
};

export const handleListDashboardCategories = async (userToken, search = "") => {
  const trimmedSearch = typeof search === "string" ? search.trim() : "";
  const parameters = trimmedSearch ? { q: trimmedSearch } : {};

  const response = await generalRequest({
    version: "v1",
    typeRequest: "GET",
    nameUrl: "listDashboardCategories",
    parameters,
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
  });

  if (response?.status !== "success" || !Array.isArray(response?.data)) {
    throw new Error(response?.msg || "No se pudieron listar las categorías del tablero.");
  }

  return response.data;
};

export const handleCreateDashboardCategory = async (userToken, name) => {
  const response = await generalRequest({
    version: "v1",
    typeRequest: "POST",
    nameUrl: "createDashboardCategory",
    body: { name: name.trim() },
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    enableNotification: true,
    nameMessage: "etiqueta",
  });

  if (response?.status !== "success" || !response?.data) {
    throw new Error(response?.msg || "No se pudo crear la etiqueta.");
  }

  return response.data;
};

export const handleUpdateDashboardCategories = async (
  dashboardId,
  { category_ids = [], category_names = [] },
  userToken
) => {
  const response = await generalRequest({
    version: "v1",
    typeRequest: "PUT",
    nameUrl: "updateDashboardCategories",
    body: { category_ids, category_names },
    dynamicParams: { id: dashboardId },
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    enableNotification: true,
    nameMessage: "etiquetas del tablero",
  });

  if (response?.status !== "success" || !response?.data) {
    throw new Error(response?.msg || "No se pudieron actualizar las etiquetas del tablero.");
  }

  return response.data;
};

export const handleUpdateDashboardCategory = async (userToken, categoryId, name) => {
  const response = await generalRequest({
    version: "v1",
    typeRequest: "PUT",
    nameUrl: "updateDashboardCategory",
    body: { name: name.trim() },
    dynamicParams: { category_id: categoryId },
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    enableNotification: true,
    nameMessage: "etiqueta",
  });

  if (response?.status !== "success" || !response?.data) {
    throw new Error(response?.msg || "No se pudo actualizar la etiqueta.");
  }

  return response.data;
};

export const handleListDashboardsByCategory = async (userToken, categoryId) => {
  const response = await generalRequest({
    version: "v1",
    typeRequest: "GET",
    nameUrl: "listDashboardsByCategory",
    dynamicParams: { category_id: categoryId },
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
  });

  if (response?.status !== "success" || !response?.data) {
    throw new Error(response?.msg || "No se pudieron obtener los tableros vinculados a la etiqueta.");
  }

  return response.data;
};

export const handleDeleteDashboardCategory = async (userToken, categoryId) => {
  const response = await generalRequest({
    version: "v1",
    typeRequest: "DELETE",
    nameUrl: "deleteDashboardCategory",
    dynamicParams: { category_id: categoryId },
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    enableNotification: true,
    nameMessage: "etiqueta",
  });

  if (response?.status !== "success") {
    throw new Error(response?.msg || "No se pudo eliminar la etiqueta.");
  }

  return response.data;
};

export const handleListAuthorizedDashboardsByCategory = async (userToken, categoryId) => {
  const response = await generalRequest({
    version: "v1",
    typeRequest: "GET",
    nameUrl: "listAuthorizedDashboardsByCategory",
    dynamicParams: { category_id: categoryId },
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
  });

  if (response?.status !== "success" || !response?.data) {
    throw new Error(response?.msg || "No se pudieron obtener los tableros vinculados a la etiqueta.");
  }

  return response.data;
};

export const handleListAuthorizedDashboardsGroupedByCategory = async (userToken) => {
  const response = await generalRequest({
    version: "v1",
    typeRequest: "GET",
    nameUrl: "listAuthorizedDashboardsGroupedByCategory",
    parameters: {},
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
  });

  if (response?.status !== "success" || !response?.data) {
    throw new Error(
      response?.msg || "No se pudieron obtener los tableros autorizados agrupados por etiqueta."
    );
  }

  return response.data;
};
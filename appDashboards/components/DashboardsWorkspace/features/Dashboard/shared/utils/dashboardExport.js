import JSZip from "jszip";

const getDataSourceName = (source) => {
  if (!source || typeof source !== "object") return null;
  return source.name || source.alias || source.title || null;
};

const buildDataSourceNamesById = (dataSources = []) => {
  return dataSources.reduce((acc, source) => {
    const sourceId =
      source?.id || source?.data_source_id || source?.datasource_id;
    const sourceName = getDataSourceName(source);

    if (sourceId && sourceName) {
      acc[String(sourceId)] = sourceName;
    }

    return acc;
  }, {});
};

export const unwrapDashboardExportPayload = (value) => {
  if (!value || typeof value !== "object") return value;
  if (value.dashboard || Array.isArray(value.panels) || Array.isArray(value.layout)) {
    return value;
  }
  const inner = value.data;
  if (inner && typeof inner === "object") {
    if (inner.dashboard || Array.isArray(inner.panels) || Array.isArray(inner.layout)) {
      return inner;
    }
  }
  return value;
};

const replaceDatasourceIds = (value, dataSourceNamesById) => {
  if (Array.isArray(value)) {
    return value.map((item) => replaceDatasourceIds(item, dataSourceNamesById));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, rawValue]) => {
    if (key === "datasource_id") {
      const dataSourceName = dataSourceNamesById[String(rawValue)];

      if (dataSourceName) {
        acc.datasource_name = dataSourceName;
        return acc;
      }
    }

    acc[key] = replaceDatasourceIds(rawValue, dataSourceNamesById);
    return acc;
  }, {});
};
const collectDatasourceIds = (value, datasourceIds = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectDatasourceIds(item, datasourceIds));
    return datasourceIds;
  }

  if (!value || typeof value !== "object") {
    return datasourceIds;
  }

  Object.entries(value).forEach(([key, rawValue]) => {
    if (key === "datasource_id" && rawValue) {
      datasourceIds.add(String(rawValue));
    }

    collectDatasourceIds(rawValue, datasourceIds);
  });

  return datasourceIds;
};

export const getMissingDashboardExportDatasourceIds = ({
  dashboardExport,
  dataSources = [],
}) => {
  const payload = unwrapDashboardExportPayload(dashboardExport);
  const dataSourceNamesById = buildDataSourceNamesById(dataSources);
  const datasourceIds = Array.from(collectDatasourceIds(payload));

  return datasourceIds.filter((id) => !dataSourceNamesById[id]);
};
const sanitizeFileName = (fileName) => {
  const normalized = String(fileName || "tablero")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_");

  return normalized || "tablero";
};
const buildDateSuffix = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${dd}-${mm}-${yyyy}`;
};

const buildExportBaseName = (dashboardName) => {
  return `${sanitizeFileName(dashboardName)}_${buildDateSuffix()}`;
};

/**
 */
export const buildDashboardExportFileName = (dashboardName) => {
  return `${buildExportBaseName(dashboardName)}.ifz`;
};


const DEFAULT_DASHBOARD_DESCRIPTION =
  "Este es un tablero de analítica que permite la visualización de datos " +
  "mediante gráficas interactivas. Contiene paneles configurados con métricas " +
  "y dimensiones seleccionadas para el análisis de información de tu organización.";

const buildReadmeContent = ({ dashboardName, dashboardDescription, exportedAt, version }) => {
  const description =
    dashboardDescription && dashboardDescription.trim() ? dashboardDescription.trim() : DEFAULT_DASHBOARD_DESCRIPTION;

  const exportDate = exportedAt
    ? new Date(exportedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })
    : new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

  return [
    "  TABLERO EXPORTADO — IFindIT",
    "",
    "",
    `Nombre: ${dashboardName || "IFindIT Dashboard"}`,
    "",
    "Descripción:",
    `  ${description}`,
    "",
    "----------------------------------------",
    `Exportado:   ${exportDate}`,
    `Versión:     ${version || "1.0"}`,
    "----------------------------------------",
    "",
    "Contenido del archivo:",
    `  • ${buildExportBaseName(dashboardName)}.json  — datos del tablero`,
    "  • README.txt                               — este archivo",
    "",
    "Para importar este tablero, usa la opción",
    "'Importar tablero' en IFindIT y selecciona",
    "el archivo .ifz.",
    "",
    "========================================",
  ].join("\n");
};

export const prepareDashboardExportData = ({
  dashboardExport,
  dataSources = [],
}) => {
  const payload = unwrapDashboardExportPayload(dashboardExport);
  const dataSourceNamesById = buildDataSourceNamesById(dataSources);
  return replaceDatasourceIds(payload, dataSourceNamesById);
};
export const downloadDashboardExportZip = async ({ data, fileName, dashboardName: dashboardNameOverride }) => {
  const payload = unwrapDashboardExportPayload(data);
  const dashboardName = dashboardNameOverride || payload?.dashboard?.name;
  const baseName = buildExportBaseName(dashboardName);
  const zipFileName = fileName || `${baseName}.ifz`;
  const jsonFileName = `${baseName}.json`;

  const readmeContent = buildReadmeContent({
    dashboardName,
    dashboardDescription: payload?.dashboard?.description,
    exportedAt: payload?.exported_at,
    version: payload?.version,
  });

  const jsonContent = JSON.stringify(payload, null, 2);

  const zip = new JSZip();
  zip.file(jsonFileName, jsonContent);
  zip.file("README.txt", readmeContent);

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", zipFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LabelIcon from '@mui/icons-material/Label';

/**
 * Genera la lista de fuentes de datos para el formulario
 * @param {Array} dataSourcesData - Array de fuentes de datos desde la API
 * @returns {Array} Lista formateada para el select
 */
export const getDataSourcesList = (dataSourcesData = []) => {
  if (!dataSourcesData || dataSourcesData.length === 0) return [];
  return dataSourcesData.map((source) => ({
    id: source.id,
    showed_name: source.alias,
    value: source.id
  }));
};

/**
 * Genera los campos del formulario base
 * @param {Array} dataSourcesList - Lista de fuentes de datos formateada
 * @returns {Array} Array de campos del formulario
 */
export const getBaseFormFields = (dataSourcesList = []) => [
    {
        id: "name",
        component: "input",
        value: "",
        title: "Nombre del tablero",
        info: "Ingresar el nombre del tablero",
        placeholder: "",
        type: "text",
        category: "dashboard"
    },
    {
        id: "description",
        component: "input",
        value: "",
        title: "Descripción",
        info: "Descripción del tablero",
        placeholder: "",
        type: "text",
        category: "dashboard"
    },
    {
        id: "data_sources",
        component: "select",
        value: "",
        title: "Fuentes de datos",
        info: "Fuentes de datos del tablero",
        placeholder: "",
        type: "text",
        category: "configuration",
        showValues: dataSourcesList || [],
        multiple: true
    }
];

export const groupConfig = {
    order: ['dashboard', 'configuration'],
    labels: { dashboard: 'Información del Tablero', configuration: 'Configuración' },
    icons: {
        dashboard: <DashboardIcon sx={{ fontSize: '20px', color: 'primary.main' }} />,
        configuration: <SettingsIcon sx={{ fontSize: '20px', color: 'primary.main' }} />
    }
};

export const createDashboardCategoriesMeta = {
    sectionTitle: "Etiquetas",
    fieldTitle: "Seleccione una etiqueta o cree una",
    sectionIcon: <LabelIcon sx={{ fontSize: '20px', color: 'primary.main' }} />,
};
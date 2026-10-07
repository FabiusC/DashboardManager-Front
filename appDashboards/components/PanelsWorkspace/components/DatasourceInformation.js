import { Typography, Box, Tooltip, alpha } from '@mui/material';
import { InfoRounded } from '@mui/icons-material';
import { getContrastColor } from '../../Recursive/mui_styled_components';
import { useChartContext } from '../hooks/useChartContext';
import { useDataSourceById } from '../../DashboardsWorkspace/hooks/useDataSources';

const toDisplayText = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayText(item, ""))
      .filter(Boolean)
      .join(", ") || fallback;
  }
  if (typeof value === "object") {
    const preferredKeys = ["alias", "name", "title", "label", "value", "id"];
    for (const key of preferredKeys) {
      const candidate = value[key];
      if (typeof candidate === "string" || typeof candidate === "number" || typeof candidate === "boolean") {
        return String(candidate);
      }
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      return fallback;
    }
  }
  return fallback;
};

export const DataSourceTooltipContent = ({ datasource }) => {
  return (
    <Box sx={{ p: 1, maxWidth: 280 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: '14px' }}>
        {"Información de la fuente de datos"}
      </Typography>
      <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
        <strong>Nombre:</strong> {toDisplayText(datasource.name)}
      </Typography>
      <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
        <strong>Alias:</strong> {toDisplayText(datasource.alias)}
      </Typography>
  
      <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
        <strong>Descripción:</strong> {toDisplayText(datasource.description)}
      </Typography>
    </Box>
  );
};

export default function DatasourceInformation(props) {
  const chart = useChartContext();
  const datasourceId = chart.state?.queryParameters?.datasource_id;
  const { data: datasource, isLoading, isError, error, notFound } = useDataSourceById(datasourceId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginLeft: '8px', marginRight: '4px' }}>
      {isLoading && (
        <Typography sx={{
          fontSize: { lg: "17px", md: "17x", sm: "16px", xs: "16x" },
          textAlign: 'center', pl: "8px", pr: "4px",
          color: theme => alpha(theme.palette.primary.main, 0.4),
        }}
          component="div"
        >
          Cargando información de la fuente de datos...
        </Typography>
      )}
      {!isLoading && (isError || notFound) && (
        <Typography sx={{
          fontSize: { lg: "14px", md: "14px", sm: "13px", xs: "13px" },
          textAlign: 'center', pl: "8px", pr: "4px",
          color: theme => alpha(theme.palette.error.main, 0.7),
          fontStyle: 'italic',
        }}
          component="div"
        >
          {notFound ? "Fuente de datos no encontrada" : `Error: ${toDisplayText(error, "No se pudo cargar la información")}`}
        </Typography>
      )}
      {datasource && (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginRight: '3px' }}>
            <Typography
              sx={{
                fontSize: { lg: "14px", md: "14px", sm: "13px", xs: "13px" },
                fontWeight: 'bold',
                textAlign: 'center',
                color: theme => alpha(theme.palette.primary.main, 0.9),
              }}
              component="div"
            >
              Fuente de datos:
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: "4px",
              color: theme => theme.palette.primary.main,
              backgroundColor: theme => alpha(
                theme.palette.primary.main,
                getContrastColor(theme.palette.primary.main) == '#000000' ? 0.3 : 0.1
              ),
              paddingTop: '5px',
              paddingBottom: '5px',
              paddingLeft: '8px',
              paddingRight: '8px',
              borderRadius: '15px',
              height: '15px',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              {toDisplayText(datasource.alias)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip
                title={<DataSourceTooltipContent datasource={datasource} />}
                placement="bottom"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      boxShadow: 3,
                      borderRadius: 1,
                      p: 0.4,
                    },
                  },
                }}
              >
                <InfoRounded color="inherit" sx={{ fontSize: 18, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
          </Box>  
        </>
      )}
    </Box>
  )
}
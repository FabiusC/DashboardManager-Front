import { Typography, Box } from '@mui/material';

/**
 * Componente que muestra el contenido del tooltip con la información de la fuente de datos
 * @param {Object} props - Props del componente
 * @param {Object} props.datasource - Objeto con la información de la fuente de datos
 */
export const DataSourceTooltipContent = ({ datasource }) => {
  return (
    <Box sx={{ p: 1, maxWidth: 280 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: '14px' }}>
        {"Información de la fuente de datos"}
      </Typography>
      <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
        <strong>Nombre:</strong> {datasource.name}
      </Typography>
      <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
        <strong>Alias:</strong> {datasource.alias}
      </Typography>
      {datasource.records_count !== undefined && datasource.records_count !== null && (
        <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
          <strong>No. registros:</strong> {datasource.records_count}
        </Typography>
      )}
      <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
        <strong>Descripción:</strong> {datasource.description}
      </Typography>
      {datasource.catalog && (
        <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
          <strong>Catálogo:</strong> {datasource.catalog}
        </Typography>
      )}
      {datasource.schema && (
        <Typography variant="body2" gutterBottom sx={{ fontSize: '12px' }}>
          <strong>Esquema:</strong> {datasource.schema}
        </Typography>
      )}
      {datasource.table && (
        <Typography variant="body2" sx={{ fontSize: '12px' }}>
          <strong>Tabla:</strong> {datasource.table}
        </Typography>
      )}
    </Box>
  );
};

export default DataSourceTooltipContent;


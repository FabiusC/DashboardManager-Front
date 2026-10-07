import { Typography, Box, Tooltip, alpha } from '@mui/material';
import { InfoRounded } from '@mui/icons-material';
import { getContrastColor } from '../../../Recursive/mui_styled_components';
import { DataSourceTooltipContent } from './DataSourceTooltipContent';
import { useDataSourcesList } from '../../hooks/useDataSources';


export default function DatasourceInformation({ dashboard }) {
  let datasourceList = useDataSourcesList();
  let datasource = [];
  
  for (const sourceId of (dashboard?.data_sources ?? [])) {
    for (const datasourceItem of (datasourceList?.data ?? [])) {
      if (datasourceItem.id === sourceId) {
        datasource.push(datasourceItem);
      }
    }
  }
  
  return (
    <Box key={`datasource-${dashboard.id}`} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginLeft: '8px', marginRight: '4px' }}>
      {datasource.length === 0 && (
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
      {datasource.length > 0 && datasource.map(source => (
        <Box key={`datasource-${source.name}`} sx={{ display: "flex" }}>
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
              {source.alias}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip
                title={<DataSourceTooltipContent datasource={source} />}
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
        </Box>
      ))}
    </Box>
  );
}


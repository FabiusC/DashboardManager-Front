import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  Paper,
  List,
  Skeleton,
  Tooltip,
  ListItem,
  Avatar,
  useTheme,
  Grid,
  Chip,
} from '@mui/material';
import {
  TableRowsRounded,
  ViewColumnRounded,
  LocalOfferRounded,
  MoreVert,
  Addchart,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { handleList } from '../../../../helpers/dashboardAPI/genericRequest';
import { resolveFieldType } from '@components/DashboardsWorkspace/hooks/useFields';
import { triggerChartType } from './ChartLibraryFunctions';
import { ClipLoader, PuffLoader } from 'react-spinners';
import { hexToRgba } from '../../../Recursive/mui_styled_components';
import { connect, useDispatch } from 'react-redux';

import { useChartContext } from '../../hooks/useChartContext';
import usePanelsWorkspaceActions from '../../hooks/usePanelsWorkspaceActions'

const FieldChip = ({ field, nameClass }) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <ListItem
      sx={{
        p: 0.8,
        cursor: "pointer",
        "&:hover": {
          backgroundColor: theme => alpha(theme.palette.primary.main, 0.2)
        },
        borderRadius: "20px",
        mb: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme => alpha(theme.palette.primary.main, 0.2),
        maxHeight: "33px",
        width: "92%"
      }}
    >
      <Box>
        {field.is_dimension ? (
          <Avatar
            sx={{
              width: 19,
              height: 19,
              backgroundColor: theme => theme.palette.primary.main,
              color: "#FFFFFF",
              mr: 0.5,
              fontSize: '8px'
            }}
          >
            {"abc"}
          </Avatar>
        ) : (
          <Avatar
            sx={{
              width: 19,
              height: 19,
              backgroundColor: theme => theme.palette.primary.main,
              color: "#FFFFFF",
              mr: 0.5,
              fontSize: '8px'
            }}>
            {"123"}
          </Avatar>
        )}
      </Box>

      <Box
        sx={{
          overflow: 'hidden',
          width: '85%',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Tooltip
          title={field.name}
          placement="right"
          arrow
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 15],
                  },
                },
              ],
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'transform 10s linear',
              fontFamily: 'Roboto, sans-serif',
              fontSize: '12px'
            }}
          >
            {field.name}
          </Typography>
        </Tooltip>
      </Box>
      {/* TODO: Add edit and delete functionality when it is implemented from the backend
      <IconButton size="small" onClick={handleClick}>
        <MoreVert sx={{ fontSize: '15px', color: theme.palette.primary.main }} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>Cambiar</MenuItem>
        <MenuItem onClick={handleClose}>Eliminar</MenuItem>
      </Menu>
      */}
    </ListItem>
  );
};


const Section = ({ title, fields, icon, classNameSection }) => (
  <Paper
    key={title}
    variant="outlined"
    sx={{
      mb: "1px",
      border: 'none',
      maxWidth: '170px',
      background: theme => alpha(theme.palette.primary.main, 0.05),
      flexShrink: 0,
    }}>
    <Typography
      sx={{
        fontSize: '13px',
        backgroundColor: theme => alpha(theme.palette.primary.main, 0.8),
        color: theme => theme.palette.primary.contrastText,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        pl: 1,
        pr: 1,
        pt: "4px",
        pb: "4px",
        mb: 1,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: theme => alpha(theme.palette.primary.main, 0.1),
        height: "20px",
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginRight: 0.3 }}>
        {icon}
      </Box>
      {title}
    </Typography>
    <List
      className={classNameSection}
      disablePadding
      sx={{
        mb: "10px",
        minHeight: "120px",
        maxHeight: "150px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {fields.map((field) => (
        <FieldChip field={field} nameClass={classNameSection} />
      ))}
    </List>
  </Paper>
);


const ChartLibrary = ({ title, chartLibrary, icon, classNameSection, panel, isLoadingList, isImageLoaded, setIsImageLoaded, onSelectedChartType , user}) => {
  const theme = useTheme();
  const chart = useChartContext();
  const chartState = chart.state;
  const {
    /* acciones */
    handleSelectedChartType,
   
  } = usePanelsWorkspaceActions(user.userID);
  const staticPrefix = process.env.staticPrefix;

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header similar al de la imagen */}
      <Box
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
          {icon}
        <Typography variant="body2" fontWeight={400} sx={{ flex: 1 }}>
          {title}
        </Typography>
        <Box sx={{ 
          width: 16, 
          height: 16, 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography variant="caption" sx={{ fontSize: '10px' }}>
            {chartLibrary.length}
          </Typography>
        </Box>
      </Box>

      {/* Grid de gráficas */}
      <Box sx={{ p: 1 }}>
        {isLoadingList ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <PuffLoader color={theme.palette.primary.main} size={60} speedMultiplier={1.5} />
          </Box>
        ) : chartLibrary.length > 0 ? (
          <Box sx={{
            maxHeight: chartState.queryParameters?.fields_distribution ? '400px' : '80vh',
              overflowY: 'auto',
            // Estilos de scrollbar mejorados
              '&::-webkit-scrollbar': {
              width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme => alpha(theme.palette.primary.main, 0.3),
              borderRadius: '3px',
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.primary.main, 0.5),
              },
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
          }}>
            {/* Gráficas disponibles */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ 
                color: 'text.secondary', 
                fontWeight: 600,
                display: 'block',
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Disponibles ({chartLibrary.filter(chart => chart.is_active).length})
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                columnGap: 1,
                rowGap: 1,
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
              }}>
                {chartLibrary
                  .filter(chart => chart.is_active)
                  .map((chart) => (
                    <Box key={chart.id} sx={{ width: '100%', boxSizing: 'border-box' }}>
                <Tooltip
                  title={
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {chart.alias}
                        </Typography>
                        <Chip
                          size="small"
                          label={chart.is_active ? 'Disponible' : 'No disponible'}
                          color={chart.is_active ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {chart.uses}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ display: 'block', textTransform: 'capitalize', mt: 0.5 }}
                      >
                        {chart.chart_family.alias}
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="right"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        pointerEvents: 'none',
                        backgroundColor: 'white',
                        color: 'black',
                        boxShadow: 3,
                        borderRadius: 1,
                        maxWidth: 300,
                        p: 1.5,
                      },
                    },
                    arrow: {
                      sx: {
                        color: 'white',
                      },
                    },
                  }}
                >
                      <Box
                        sx={{
                          boxSizing: 'border-box',  
                          px: 1,
                          border: '1px solid',
                          borderColor: 'grey.300',
                          bgcolor: 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: '0.2s',
                          borderRadius: 1,
                          minHeight: '110px',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                        onClick={() => handleSelectedChartType(chart)}
                      >
                        {/* Availability Icon */}
                        <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                          <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                        </Box>

                        {/* Chart Icon */}
                        <Box
                          sx={{
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '50px',
                          }}
                        >
                          {!isImageLoaded && (
                            <ClipLoader
                              color={hexToRgba(theme.palette.primary.main, 0.9)}
                              size={15}
                              speedMultiplier={0.6}
                            />
                          )}
                          <img
                            src={staticPrefix + "/img/ChartLibrary/" + chart.name + ".png"}
                            height="45"
                            onLoad={() => setIsImageLoaded(true)}
                            style={{ 
                              display: isImageLoaded ? 'block' : 'none',
                              objectFit: 'contain',
                              maxWidth: '100%',
                            }}
                          />
                        </Box>

                        {/* Chart Name */}
                        <Typography
                          variant="caption"
                          align="center"
                          color="text.primary"
                          sx={{
                            lineHeight: 1.3,
                            fontSize: '10px',
                            textAlign: 'center',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            width: '100%',
                            fontWeight: 500,
                          }}
                        >
                          {chart.alias}
                        </Typography>

                      </Box>
                </Tooltip>
                    </Box>
                  ))}
              </Box>
            </Box>

            {/* Gráficas no disponibles */}
            {chartLibrary.filter(chart => !chart.is_active).length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 600,
                  display: 'block',
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  No disponibles ({chartLibrary.filter(chart => !chart.is_active).length})
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  columnGap: 1,
                  rowGap: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                }}>
                  {chartLibrary
                    .filter(chart => !chart.is_active)
                    .map((chart) => (
                      <Box key={chart.id} sx={{ width: '100%', boxSizing: 'border-box' }}>
                        <Tooltip
                          title={
                            <Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" fontWeight="bold">
                                  {chart.alias}
                                </Typography>
                                <Chip
                                  size="small"
                                  label="No disponible"
                                  color="error"
                                  variant="outlined"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" mt={1}>
                                {chart.uses}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="primary"
                                sx={{ display: 'block', textTransform: 'capitalize', mt: 0.5 }}
                              >
                                {chart.chart_family.alias}
                              </Typography>
                            </Box>
                          }
                          arrow
                          placement="right"
                          componentsProps={{
                            tooltip: {
                              sx: {
                                pointerEvents: 'none',
                                backgroundColor: 'white',
                                color: 'black',
                                boxShadow: 3,
                                borderRadius: 1,
                                maxWidth: 300,
                                p: 1.5,
                              },
                            },
                            arrow: {
                              sx: {
                                color: 'white',
                              },
                            },
                          }}
                        >
                          <Box
                    sx={{
                              px: 1.5,
                              border: '1px solid',
                              borderColor: 'grey.100',
                              bgcolor: 'white',
                              opacity: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                              justifyContent: 'center',
                      position: 'relative',
                              cursor: 'not-allowed',
                      transition: '0.2s',
                              borderRadius: 1,
                              minHeight: '110px',
                    }}
                  >
                    {/* Availability Icon */}
                            <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                              <Cancel sx={{ fontSize: 14, color: 'error.main' }} />
                    </Box>

                    {/* Chart Icon */}
                            <Box
                      sx={{
                        mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '50px',
                              }}
                            >
                      {!isImageLoaded && (
                        <ClipLoader
                          color={hexToRgba(theme.palette.primary.main, 0.9)}
                                  size={15}
                          speedMultiplier={0.6}
                        />
                      )}
                      <img
                        src={staticPrefix + "/img/ChartLibrary/" + chart.name + ".png"}
                                height="45"
                        onLoad={() => setIsImageLoaded(true)}
                                style={{ 
                                  display: isImageLoaded ? 'block' : 'none',
                                  objectFit: 'contain',
                                  maxWidth: '100%',
                                }}
                              />
                            </Box>

                    {/* Chart Name */}
                    <Typography
                      variant="caption"
                      align="center"
                              color="text.disabled"
                      sx={{
                                lineHeight: 1.3,
                                fontSize: '10px',
                        textAlign: 'center',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                                width: '100%',
                                fontWeight: 500,
                      }}
                    >
                      {chart.alias}
                    </Typography>

                          </Box>
                </Tooltip>
                      </Box>
            ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '12px', lineHeight: 1.2 }}
            >
              No se encontraron gráficas disponibles
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const VisualizationSetup = (props) => {

  const [rowFields, setRowFields] = useState([]);
  const [columnFields, setColumnFields] = useState([]);
  const [attributeFields, setAttributeFields] = useState([]);
  const [delayedLoading, setDelayedLoading] = useState(false);
  const [dimensionFields, setDimensionFields] = useState([]);
  const [measureFields, setMeasureFields] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [chartFamilies, setChartFamilies] = useState([]);
  const [chartLibrary, setChartLibrary] = useState([]);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const chartHook = useChartContext();
  const chart = chartHook.state;
  const isLoading = props?.panel?.state?.isLoadingFieldsDistribution;
  const dispatch = useDispatch();

  useEffect(() => {
    let timeoutId;
    if (isLoading) {
      setDelayedLoading(true);
      timeoutId = setTimeout(() => {
        if (!isLoading) setDelayedLoading(false);
      }, 1000);
    } else {
      timeoutId = setTimeout(() => setDelayedLoading(false), 1000);
    }
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    if (chart.queryParameters?.fields_distribution) {
      const { row_fields, column_fields, attribute_fields } = chart.queryParameters.fields_distribution;
      setRowFields(row_fields || []);
      setColumnFields(column_fields || []);
      setAttributeFields(attribute_fields || []);
    } else {
      setRowFields([]);
      setColumnFields([]);
      setAttributeFields([]);
    }
  }, [chart.queryParameters?.fields_distribution]);

  useEffect(() => {
    getFamilyChart();
  }, []);

  useEffect(() => {
    const fetchChartLibrary = async () => {
      if (chart.queryParameters.selected_fields) {
        const selectedFields = chart.queryParameters.selected_fields;
        const dimensions = selectedFields.filter((field) => resolveFieldType(field) === "dimension");
        const measures = selectedFields.filter((field) => resolveFieldType(field) === "measure");
        setIsLoadingList(true);
        try {
          const allCharts = async () =>{
              let chartPerFamily = 50;
              let fieldsSearchChart = ['name', 'description', 'alias', 'tags', 'uses'];
              const chartsResponse = await handleList(
                dispatch,
                props.user[0]?.userID,
                'chartTypeListByFamily',
                'tipo de gráficas',
                [],
                chartPerFamily,
                "",
                1,
                fieldsSearchChart
              );
              let charts = chartsResponse['results'];
              return charts.map((chart) => {
                const isAvailable = triggerChartType(chart, dimensions, measures);
                return {
                  ...chart,
                  is_active: isAvailable,
                  family_info: { },
                };
              });
        
          }

          const flattenedCharts = await allCharts()
          console.log(flattenedCharts , "graficas todas")
          setChartLibrary(flattenedCharts);
        } catch (error) {
          console.error('Error fetching chart library:', error);
        } finally {
          setIsLoadingList(false);
        }
      }
    };
    if (chartFamilies.length > 0) {
      fetchChartLibrary();
    }
  }, [chartFamilies.length, chart.queryParameters.selected_fields]);

  const getFamilyChart = async () => {
    setIsLoadingList(true);
    const fieldsSearch = ["name", "description", "uses"]
    let filters = []
    let currentPage = 1
    let chartFamilyPerPage = 20
    const response = await handleList(dispatch, props.user[0]?.userID, 'chartFamilyList', 'familia de gráficas', filters, chartFamilyPerPage, "", currentPage, fieldsSearch);
    if (response) {
      setChartFamilies(response["results"]);
    }
  };


  return (
    <Box sx={{
      width: "280px",
      height: "100%",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: 1,
    }}>
      <ChartLibrary
        title="Gráficas"
        chartLibrary={chartLibrary}
        icon={<Addchart sx={{ fontSize: "16px", color: theme => theme.palette.primary.contrastText }} />}
        classNameSection="charts-selector-scrollable-list"
        panel={chart}
        isLoadingList={isLoadingList}
        isImageLoaded={isImageLoaded}
        setIsImageLoaded={setIsImageLoaded}
        onSelectedChartType={props.onSelectedChartType}
        user={props.user[0]}
      />

      {delayedLoading &&
        <>
          <Skeleton animation="wave" sx={{ mr: 1, ml: 1, mb: 0.5 }} />
          <Skeleton sx={{ height: 120, m: 1 }} animation="wave" variant="rectangular" />
          <Skeleton animation="wave" sx={{ mr: 1, ml: 1, mb: 0.5 }} />
          <Skeleton sx={{ height: 120, m: 1 }} animation="wave" variant="rectangular" />
          <Skeleton animation="wave" sx={{ mr: 1, ml: 1, mb: 0.5 }} />
          <Skeleton sx={{ height: 120, m: 1 }} animation="wave" variant="rectangular" />
        </>
      }
      {!delayedLoading && rowFields.length != 0 &&
        <Section
          title="Filas"
          fields={rowFields}
          icon={<TableRowsRounded sx={{ fontSize: "16px", color: theme => theme.palette.primary.contrastText }} />}
          classNameSection="rows-selector-scrollable-list"
        />
      }
      {!delayedLoading && columnFields.length != 0 &&
        <Section
          title="Columnas"
          fields={columnFields}
          icon={<ViewColumnRounded sx={{ fontSize: "16px", color: theme => theme.palette.primary.contrastText }} />}
          classNameSection="columns-selector-scrollable-list"
        />
      }
      {!delayedLoading && attributeFields.length != 0 &&
        <Section
          title="Atributos"
          fields={attributeFields}
          icon={<LocalOfferRounded sx={{ fontSize: "16px", color: theme => theme.palette.primary.contrastText }} />}
          classNameSection="attributes-selector-scrollable-list"
        />
      }
    </Box>
  );
};

const mapStateToProps = state => {
  return {
    user: state.user
  };
};

export default connect(mapStateToProps)(VisualizationSetup);

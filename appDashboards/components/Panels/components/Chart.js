const { useState, useEffect, lazy, Suspense } = require("react");
import { handleQuery } from "@helpers/QueryManagerAPI/queryRequest";
import { useDispatch } from 'react-redux';
import { connect } from "react-redux";

import ChartLoader from "../../PanelsWorkspace/chart/loaders/ChartLoader";
import { Box, Typography } from "@mui/material";
import useChart from "@components/Charts/useChar"

const Chart = (props) => {
  const [panelRawData, setPanelRawData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataError, setDataError] = useState(false)
  const [panelWithData, setPanelWithData] = useState()
  const { panel } = props
  const dispatch = useDispatch();
  const isNoneQueryChart = panel?.chart_type?.query_type === "none_query";
  const panelForChart = panelWithData || (
    isNoneQueryChart
      ? {
          ...panel,
          colorStrategy: panel.color_strategy,
          queryParameters: { ...(panel.query_parameters || {}) },
        }
      : undefined
  );



  const getDataFromQuery = async () => {

    if (isNoneQueryChart) {
      return;
    }

    if (panel?.chart_type?.id) {
      setIsLoadingData(true);
      setDataError(false);

      try {
        let bodyQuery;
        if (panel.chart_type.query_type === "aggregation") {
          bodyQuery = {
            query_type: "aggregation",
            datasource_id: panel.query_parameters.datasource_id,
            group_by: panel.query_parameters.query_fields_distribution.group_by_fields,
            aggregations: panel.query_parameters.query_fields_distribution.aggregation_fields,
            limit: panel.query_parameters.limit || 1000,
          };
        } else if (panel.chart_type.query_type === "records") {
          bodyQuery = {
            query_type: "records",
            datasource_id: panel.query_parameters.datasource_id,
            showed_fields: panel.query_parameters.selected_fields,
          };

        }
        else if (panel.chart_type.query_type === "none_query") {
          bodyQuery = {
            query_type: "none_query",
          };
        }

        let response = await handleQuery(dispatch,
          props.user[0].userID,
          'query',
          'datos de la gráfica',
          bodyQuery,
          {});

        if (response[0]) {
          setPanelRawData(response[1]);
          // Crear una copia del panel con los datos agregados
          const updatedPanel = {
            ...panel,
            colorStrategy: panel.color_strategy,
            queryParameters: {
              rawData: response[1],
              ...(panel.query_parameters || {})
            }
          };
          setPanelWithData(updatedPanel);
        } else {
          setDataError(true);
          setPanelRawData([]);
          const updatedPanel = {
            ...panel,
            colorStrategy: panel.color_strategy,
            queryParameters: {
              raw_data: undefined,
              ...(panel.query_parameters || {})
            }
          };
          setPanelWithData(updatedPanel);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setDataError(true);
        setPanelRawData([]);
        const updatedPanel = {
          ...panel,
          colorStrategy: (panel.color_strategy),
          queryParameters: {
            rawData: undefined,
            ...(panel.query_parameters || {})
          }
        };
        setPanelWithData(updatedPanel);
      } finally {
        setIsLoadingData(false);
      }
    }
  }


  useEffect(() => {
    if (panel?.chart_type?.id) {
      getDataFromQuery();
    }
  }, []);

  let chartInfo;


  try {
    chartInfo = useChart(
      panel?.chart_type?.name,
      panelForChart,
      true,
      {},
      panel?.id

    );
  } catch (err) {
    return (
      <Box sx={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Typography color="error">{err.message}</Typography>
      </Box>
    );
  }
  const { ChartComponent, chartData, chartProps, colors } = chartInfo;
  const isGridHeatMap = panel?.chart_type?.name === "grid_heatmap";
  // console.log("dadatdatdtat", chartData)

  if (chartData.length == 0) {
    return (
      <ChartLoader
        height="100%"
        message="Cargando gráfico..."
        size={100}
        speed={1.5}
      />
    );
  }



  // Mostrar loading mientras se carga el componente
  if (isLoading) {
    return (
      <ChartLoader
        height="100%"
        message="Cargando gráfico..."
        size={100}
        speed={1.5}
      />
    );
  }

  // Mostrar loading mientras se cargan los datos
  if (isLoadingData) {
    return (
      <ChartLoader
        height="100%"
        message="Cargando datos..."
        size={100}
        speed={1.5}
      />
    );
  }

  

  if (!isNoneQueryChart && (!panelRawData || panelRawData.length === 0)) {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#666"
      }}>
        No hay datos disponibles
      </div>
    );
  }
  // Si no hay datos, mostrar mensaje


  return (

    <Suspense
      fallback={
        <ChartLoader
          height="100%"
          message="Cargando gráfico..."
          size={100}
          speed={1.5}
        />
      }
    >
      <Box
        sx={{
          width: "100%",
          height: '400px',
          minHeight: '100%',
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer"
        }}
      >
        <ChartComponent
          {...chartProps}
          {...chartData}
          {...(!isGridHeatMap && colors != null ? { colors } : {})}
        />
      </Box >
    </Suspense>
  );
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Chart);
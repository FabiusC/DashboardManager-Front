import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Paper, Box } from '@mui/material';
import PanelItem from '@components/PanelsWorkspace/components/PanelItem';
const GridStackDashboard = dynamic(() => import('./grid/GridStackDashboard'), { ssr: false });
import DownloadFileNameModal from '@components/PanelsWorkspace/components/DownloadFileNameModal';
import SelectFieldsGuidance from '@components/PanelsWorkspace/components/SelectFieldsGuidance';
import { downloadCSV, downloadExcel, downloadJSON, downloadImage } from '@source/downloads';



const DashboardGrid = React.forwardRef(({
  layout,
  panels,
  configuration,
  previewId,
  isReadOnly,
  captureMode = false,
  onLayoutChange,
  onDropPanel,
  onDeletePanel,
  reportPreFilterConfig,
  dashboardPreFilterBlocked = false,
  onPreFilterApplied,
  onPreFilterCleared,
}, ref) => {
  const [downloadModal, setDownloadModal] = useState({
    open: false,
    type: null,
    defaultFileName: '',
    panel: null,
    downloadChartState: null,
  });

  const handleRequestDownload = useCallback(({ type, defaultFileName, panel, downloadChartState }) => {
    setDownloadModal({
      open: true,
      type,
      defaultFileName,
      panel,
      downloadChartState,
    });
  }, []);

  const handleCloseDownloadModal = useCallback(() => {
    setDownloadModal({
      open: false,
      type: null,
      defaultFileName: '',
      panel: null,
      downloadChartState: null,
    });
  }, []);

  const handleConfirmDownload = useCallback((fileName) => {
    const { type, panel, downloadChartState } = downloadModal;
    if (!type || !panel) return;

    const effectiveChartState = downloadChartState || null;
    const selectedFields = effectiveChartState?.queryParameters?.selected_fields || [];
    const fieldNames = selectedFields.map((field) => field.alias || field.id);
    const metric = selectedFields[selectedFields.length - 1]?.metric;
    const data = effectiveChartState?.queryParameters?.rawData ?? effectiveChartState?.queryParameters?.raw_data;
    const fileNameOpt = fileName?.trim() || undefined;
    const panelId = panel?.panel?.id;

    switch (type) {
      case 'csv':
        downloadCSV({
          title: panel?.panel?.title,
          data,
          fieldNames,
          metric,
          fileName: fileNameOpt,
        });
        break;
      case 'excel':
        downloadExcel({
          title: panel?.panel?.title,
          data,
          fieldNames,
          metric,
          fileName: fileNameOpt,
        });
        break;
      case 'json':
        downloadJSON({
          title: panel?.panel?.title,
          data,
          fieldNames,
          metric,
          fileName: fileNameOpt,
        });
        break;
      case 'png':
        downloadImage({ id: panelId, title: panel?.panel?.title, fileName: fileNameOpt });
        break;
      default:
        break;
    }
    handleCloseDownloadModal();
  }, [downloadModal, handleCloseDownloadModal]);

  const panelEditionMode = captureMode || !isReadOnly;

  const renderPanel = useCallback((item) => (
    <PanelItem
      panel={item.panelData}
      chartState={item.chartState}
      editionMode={panelEditionMode}
      dashboard={true}
      domIdPrefix={captureMode ? "capture-" : ""}
      captureMode={captureMode}
      onDeletePanel={onDeletePanel ? () => onDeletePanel(item.id) : undefined}
      onRequestDownload={handleRequestDownload}
      reportPreFilterConfig={reportPreFilterConfig}
      dashboardPreFilterBlocked={dashboardPreFilterBlocked}
      onPreFilterApplied={onPreFilterApplied}
      onPreFilterCleared={onPreFilterCleared}
    />
  ), [
    panelEditionMode,
    captureMode,
    onDeletePanel,
    handleRequestDownload,
    reportPreFilterConfig,
    dashboardPreFilterBlocked,
    onPreFilterApplied,
    onPreFilterCleared,
  ]);

  const backgroundColor = configuration?.background_color || '#F5F5F5';
  const showEmptyEditorGuidance = !isReadOnly && (panels?.length ?? 0) === 0;

  return (
    <>
      <Paper
        ref={ref}
        id={previewId}
        variant="outlined"
        sx={{
          width: "100%",
          border: "none",
          borderRadius: 0,
          position: "relative",
          minHeight: captureMode ? 0 : '100vh',
          backgroundColor,
          '& .grid-stack-item-content': { overflow: 'visible' },
        }}
      >
        {showEmptyEditorGuidance && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor,
            }}
          >
            <SelectFieldsGuidance
              showGuidance
              title="Inicia seleccionando los paneles"
              description="Selecciona los paneles del costado izquierdo para agregarlos al tablero"
            />
          </Box>
        )}
        <GridStackDashboard
          panels={panels}
          layout={layout}
          configuration={configuration}
          isReadOnly={isReadOnly}
          captureMode={captureMode}
          onLayoutChange={onLayoutChange}
          onDropPanel={onDropPanel}
          renderPanel={renderPanel}
        />
      </Paper>

      <DownloadFileNameModal
        open={downloadModal.open}
        onClose={handleCloseDownloadModal}
        defaultFileName={downloadModal.defaultFileName}
        onSubmit={handleConfirmDownload}
        title="Nombre del archivo"
        subtitle="Indica el nombre con el que se guardará el archivo"
      />
    </>
  );
});

DashboardGrid.displayName = "DashboardGrid";


export default React.memo(DashboardGrid);
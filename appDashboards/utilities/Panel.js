class Panel {

  handleChangeState = (flagName, value) => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      state: {
        ...prevPanels.state,
        [flagName]: value,
      }
    }));
  }
  handleChangeChartType = (chartType) => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      chart_type: chartType,
      chart_type_id: chartType.id
    }));
  }
  handleModalCreateField = (new_field, setOpenCreateFieldModal, chart_type_id) => {
    if (chart_type_id) {
      setOpenCreateFieldModal(true);
    }
    else {
      if (!new_field || !new_field.id) {
        return;
      }
      const normalizedField = {
        ...new_field,
      };

      setPanels((prevPanels) => {
        const currentSelectedFields = prevPanels.queryParameters?.selected_fields || [];
        const existingField = currentSelectedFields.find(f => f.id === normalizedField.id);
        if (existingField) {
          return prevPanels;
        }

        const newSelectedFields = [...currentSelectedFields, normalizedField];
        return {
          ...prevPanels,
          queryParameters: {
            ...prevPanels.queryParameters,
            selected_fields: newSelectedFields
          }
        };
      });
    }

  }
  handleChangePanelQueryParameters = (key, value) => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      queryParameters: {
        ...prevPanels.queryParameters,
        [key]: value
      }
    }));
  }
  handleModalDeleteField = (field, setOpenDeleteFieldModal, chart_type_id) => {
    if (chart_type_id) {

      setOpenDeleteFieldModal(true);

    } else {
      setPanels((prevPanels) => ({
        ...prevPanels,
        queryParameters: {
          ...prevPanels.queryParameters,
          selected_fields: prevPanels.queryParameters.selected_fields.filter(f => f.id !== field.id)
        }
      }));
    }

  }
  handleConfirmCreateField = async (new_field, setOpenCreateFieldModal) => {
    if (!new_field || !new_field.id) {
      return;
    }
    const normalizedField = {
      ...new_field,
    };

    await deleteRequest(dispatch, userID, 'delatePanelUnassign_chart_type', 'configuración del panel', '', { id: panelInformation.id });
    setPanels(prev => ({
      ...prev,
      state: {
        ...prev.state,
        hasChartType: false,
      },
      chart_type: undefined,
      chart_type_id: undefined,
    }));
    setPanels((prevPanels) => {
      const currentSelectedFields = prevPanels.queryParameters?.selected_fields || [];
      const existingField = currentSelectedFields.find(f => f.id === normalizedField.id);
      if (existingField) {
        return prevPanels;
      }

      const newSelectedFields = [...currentSelectedFields, normalizedField];
      return {
        ...prevPanels,
        queryParameters: {
          ...prevPanels.queryParameters,
          selected_fields: newSelectedFields
        }
      };
    });
    setOpenCreateFieldModal(false);
  }
  handleConfirmDeleteField = async (field, setOpenDeleteFieldModal, id) => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      queryParameters: {
        ...prevPanels.queryParameters,
        selected_fields: prevPanels.queryParameters.selected_fields.filter(f => f.id !== field.id)
      }
    }));
    console.log("asd asd asd", panelInformation.chart_type_id)
    await deleteRequest(dispatch, userID, 'delatePanelUnassign_chart_type', 'configuración del panel', '', { id: panelInformation.id });
    setPanels(prev => ({
      ...prev,
      state: {
        ...prev.state,
        hasChartType: false,
      },
      chart_type: undefined,
      chart_type_id: undefined,
    }));

    console.log("borrador", panelInformation)
    setOpenDeleteFieldModal(false);
  }
  handleChangeColorStrategy = (colorStrategy) => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      color_strategy: {
        ...prevPanels.color_strategy,
        ...colorStrategy
      }
    }));
  }
  handleUploadSelectedFields = (selectedFields) => {
    const updatedFields = selectedFields.map((field) => ({
      id: field?.id,
      metric: field?.metric,
      name: field?.field_name,
      alias: field?.field_alias || field.name,
      type: field?.type
    }));
    setPanels((prevPanels) => ({
      ...prevPanels,
      queryParameters: {
        ...prevPanels.queryParameters,
        selected_fields: updatedFields,
      },
    }));
  }
  handleAddFieldsDistribution = (fieldsDistribution) => {
    const { row_fields, column_fields, attribute_fields } = fieldsDistribution;
    const updatedRowFields = row_fields.map((field) => ({
      ...field,
      metric: "count"
    }));
    const updatedColumnsFields = column_fields.map((field) => ({
      ...field,
      metric: "count"
    }));
    const updatedAttributeFields = attribute_fields.map((field) => ({
      ...field,
      metric: "count"
    }));
    setPanels((prevPanels) => ({
      ...prevPanels,
      queryParameters: {
        ...prevPanels.queryParameters,
        fields_distribution:
        {
          row_fields: updatedRowFields,
          column_fields: updatedColumnsFields,
          attribute_fields: updatedAttributeFields,
        }
      },
    }));
  }
  handleAddFieldsQueryDistribution = (queryFieldsDistribution) => {
    const { group_by_fields, aggregation_fields, showed_fields } = queryFieldsDistribution;
    const updatedGroupFields = group_by_fields.map((field) => ({
      ...field,
      metric: "count"
    }));
    const updatedAggregateFields = aggregation_fields.map((field) => ({
      ...field,
      metric: "count"
    }));
    setPanels((prevPanels) => ({
      ...prevPanels,
      queryParameters: {
        ...prevPanels.queryParameters,
        query_fields_distribution:
        {
          group_by_fields: updatedGroupFields,
          aggregation_fields: updatedAggregateFields,
          showed_fields: showed_fields
        }
      },
    }));
  }
  handleAddRawData = (rawData) => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      queryParameters: {
        ...prevPanels.queryParameters,
        raw_data: rawData
      },
    }));
  }
  handleRemoveSelectedFields = (indexToRemove) => {
    setPanels((prevPanels) => {
      const currentFields = prevPanels.queryParameters.selectedFields || [];
      const updatedFields = currentFields.filter((_, index) => index !== indexToRemove);
      return {
        ...prevPanels,
        queryParameters: {
          ...prevPanels.queryParameters,
          selectedFields: updatedFields,
        },
      };
    });
  }
  handleSetUpGeneralPanel = (key, value) => {
    setPanels((prevPanels) => (
      { ...prevPanels, [key]: value })
    )
    if (key === "width" || key === "height") {
      setLayouts((prevLayouts) => {
        const updatedLayouts = prevLayouts.lg.map(layout => {
          if (layout.i === panelInformation.id) {
            return {
              ...layout,
              [key === "width" ? "w" : "h"]: value
            };
          }
          return layout;
        });

        return { ...prevLayouts, lg: updatedLayouts };
      });
    }
  }
  handleSetUpChangedPanel = (updateComponent) => {


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

    const mergedSetUp = walkAndUpdate(prevPanels.setUpChanged || {}, updateComponent);

    //const mergedSetUp = deepMerge(prevPanels.setUpChanged || {}, updateComponent);
    setPanels((prevPanels) => ({
      ...prevPanels,
      setUpChanged: mergedSetUp
    }));
  }
  handleRefreshSetUp = async (id) => {
    let setUpInformation = await getRequest(dispatch, userID, '', '', 'getPanelSetUp', 'configuración del panel', { panel_id: id });

    setPanels((prevPanels) => ({
      ...prevPanels,
      setUp: setUpInformation || {},
    }));
  }
  handleUpdateChartComponent = (chartParameterComponent) => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      chart_components: chartParameterComponent || []
    }));
  }
  handleGetChartComponent = async (id) => {
    let chartParameterComponent = await getRequest(dispatch, userID, '', '', 'chartEditionGet', 'componentes de la gráfica', { "panel_id": id });
    console.log("CCCCchartParameterComponent", chartParameterComponent);
    setPanels((prevPanels) => ({
      ...prevPanels,
      chart_components: chartParameterComponent || []
    }));
  }
  handleUpdateLiveChartProps = (fieldKey, value, parentData = [], value_type = null) => {
    setPanels((prevPanels) => {
      const updatedLiveChartProps = { ...prevPanels.liveChartProps };

      // Convertir el valor según el tipo
      let convertedValue = value;
      if (value_type === 'boolean') {
        convertedValue = value === 'true' || value === true;
      } else if (value_type === 'integer' || value_type === 'number') {
        convertedValue = Number(value);
      } else if (value_type === 'float') {
        convertedValue = parseFloat(value);
      }

      if (parentData.length > 0) {
        // Inicializar el objeto padre si no existe
        if (!updatedLiveChartProps[parentData[0]]) {
          updatedLiveChartProps[parentData[0]] = {};
        }
        updatedLiveChartProps[parentData[0]][fieldKey] = convertedValue;
      } else {
        updatedLiveChartProps[fieldKey] = convertedValue;
      }

      return {
        ...prevPanels,
        liveChartProps: updatedLiveChartProps
      };
    });
  }
  handleClearLiveChartProps = () => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      liveChartProps: {}
    }));
  }
  handleReloadChartConfig = () => {
    setPanels((prevPanels) => ({
      ...prevPanels,
      reloadChartConfig: prevPanels.reloadChartConfig + 1
    }));
  }
  
}
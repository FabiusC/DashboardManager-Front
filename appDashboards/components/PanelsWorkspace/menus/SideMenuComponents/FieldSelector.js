import { useState, useEffect } from "react"
import { useDrag } from "react-dnd"
import _ from "lodash"
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  alpha,
  useTheme,
  Tooltip,
  Avatar,
  IconButton,
  InputBase,
  Checkbox
} from "@mui/material"
import {
  Search as SearchIcon,
  Close as CloseIcon,
  RadioButtonChecked,
  RadioButtonUnchecked,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material"
import { getContrastColor } from "../../../Recursive/mui_styled_components"

import useModals from "../../hooks/useModalsContext";
import {useChartContext} from "../../hooks/useChartContext";
import { useFieldsByDataSourceId } from "@components/DashboardsWorkspace/hooks/useFields";


export const FieldTooltipContent = ({ field: field }) => {
  return (
    <Box sx={{ p: 1, maxWidth: 280 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: '14px' }}>
        {field.alias}
      </Typography>
      <Typography variant="body2" paragraph sx={{ mt: 1, fontSize: '12px' }}>
        {field.description}
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '12px' }}>
        Tipo
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '12px' }}>
        {field.is_dimension ? "dimension" : "measure"}
      </Typography>
    </Box>
  );
};

export default function FieldSelector(props) {
  const modals = useModals();
  const chart = useChartContext();
  const setFieldToCreate = props.setFieldToCreate
  const [selectedFields, setSelectedFields] = useState([])
  const [filterFields, setFilterFields] = useState([
    { "id": "selected", "name": "Seleccionados", "isActive": false },
  ])
  const [fieldsTypes, setFieldsTypes] = useState([
    { "id": "dimension", "name": "Agrupables", "nameClass": "field-selector-scrollable-list-category" },
    { "id": "measure", "name": "Estadísticos", "nameClass": "field-selector-scrollable-list-numeric" }
  ])
  const [openFilter, setOpenFilter] = useState(false)
  const [searchText, setSearchText] = useState("")

  const dataSourceId = chart.state?.queryParameters?.datasource_id
  const { data: fieldsList = [], isLoading: isLoadingFields } = useFieldsByDataSourceId(dataSourceId)

  useEffect(() => {
    const panelsFields = chart.state?.queryParameters?.selected_fields || []
    setSelectedFields(panelsFields)
  }, [chart.state?.queryParameters?.selected_fields])

  const handleFieldClick = (field) => {
    if (chart.state.hasChartType ){
      modals.openCreateFieldModal();
      setFieldToCreate(field)

    }else{
      chart.actions.handleAddField(field);
    }
  }

  const handleFilterFields = (filterType) => {
    setFilterFields((prevFilters) =>
      prevFilters.map((filter) =>
        filter.id === filterType ? { ...filter, isActive: !filter.isActive } : filter
      )
    );
  }


  return (
    <Box sx={{ width: '150px' }}>
      <Box
        component="form"
        sx={{
          display: 'flex',
          alignItems: 'center',
          border: "1px solid #e2e8f0",
          borderRadius: '10px',
          height: '30px',
          width: '98%',
        }}
      >
        <InputBase
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            flex: 1,
            fontSize: '14px',
            height: '30px',
            pl: 1,
            'input': {
              '&::placeholder': {
                color: theme => theme.palette.primary.light,
              }
            }
          }}
          placeholder="Buscar..."
        />
        {searchText.trim().length > 0 && (
          <IconButton
            type="button"
            onClick={() => setSearchText("")}
            sx={{ pt: "5px", pb: "5px", pl: "5px", pr: "0px", "&:hover": { backgroundColor: "#fff" } }}
            aria-label="limpiar búsqueda"
          >
            <CloseIcon sx={{ fontSize: "18px", color: theme => theme.palette.primary.main, '&:hover': { color: theme => theme.palette.primary.dark } }} />
          </IconButton>
        )}
        <IconButton type="button" sx={{ p: "5px", "&:hover": { backgroundColor: "#fff" } }} aria-label="search">
          <SearchIcon sx={{ fontSize: "18px", color: theme => theme.palette.primary.main, "&:hover": { color: theme => theme.palette.primary.dark } }} />
        </IconButton>
      </Box>
      <Paper
        variant="outlined"
        sx={{
          mt: 1,
          border: 'none',
          maxWidth: '180px'
        }}>
        <Box
          className="distributed_horz"
          sx={{
            backgroundColor: "#FFF",
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
            borderBottomLeftRadius: !openFilter ? "10px" : "0px",
            borderBottomRightRadius: !openFilter ? "10px" : "0px",
            pl: 1,
            pr: 0.1,
            pt: 0.5,
            pb: 0.5,
            height: "20px",
            borderBottom: openFilter ? "0px solid #e2e8f0" : "1px solid #e2e8f0",
            borderTop: "1px solid #e2e8f0",
            borderLeft: "1px solid #e2e8f0",
            borderRight: "1px solid #e2e8f0"
          }}
        >
          <Typography
            sx={{
              fontSize: '13px',
              color: theme => theme.palette.primary.main,
            }}
          >
            Filtros
          </Typography>
          {openFilter &&
            <IconButton type="button" sx={{ p: '5px', '&:hover': { backgroundColor: '#fff' } }} onClick={() => setOpenFilter(false)}>
              <ExpandLess sx={{ fontSize: "18px", color: theme => theme.palette.primary.main, '&:hover': { color: theme => theme.palette.primary.dark } }} />
            </IconButton>
          }
          {!openFilter &&
            <IconButton type="button" sx={{ p: '5px', '&:hover': { backgroundColor: '#fff' } }} onClick={() => setOpenFilter(true)}>
              <ExpandMore sx={{ fontSize: '18px', color: theme => theme.palette.primary.main, '&:hover': { color: theme => theme.palette.primary.dark } }} />
            </IconButton>
          }
        </Box>
        <List
          className="field-selector-scrollable-list-categories"
          disablePadding
          sx={{
            mb: "10px",
            pt: 1,
            minHeight: '30px',
            maxHeight: "300px",
            overflowY: "auto",
            display: openFilter ? "flex" : "none",
            flexDirection: "column",
            alignItems: "center",
            borderBottomLeftRadius: "10px",
            borderBottomRightRadius: "10px",
            borderLeft: "1px solid #e2e8f0",
            borderRight: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {filterFields.map((filter) => (
            <Box
              key={filter.id}
              sx={{
                pl: 0.4,
                pr: 0.4,
                pt: 0.3,
                pb: 0.3,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "transparent",
                maxHeight: "33px",
                width: "92%"
              }}>
              <Box className="left_horz">
                <Checkbox
                  checked={filter.isActive}
                  onChange={() => handleFilterFields(filter.id)}
                  icon={<RadioButtonUnchecked sx={{ fontSize: '16px', padding: 0 }} />}
                  checkedIcon={<RadioButtonChecked sx={{ fontSize: '16px', padding: 0 }} />}
                  sx={{ p: 0 }}
                />
                <Typography sx={{ fontSize: "12px", pl: 0.5, pr: 0.5 }}>
                  {filter.name}
                </Typography>
              </Box>
            </Box>
          ))}
        </List>
      </Paper>
      {fieldsList.length > 0 && fieldsTypes.map((fieldType) => (
        <Paper
          key={fieldType.id}
          variant="outlined"
          sx={{
            mt: 1,
            mb: "1px",
            border: 'none',
            maxWidth: '150px',
            background: theme => alpha(theme.palette.primary.main, 0.05),
          }}>
          <Typography
            sx={{
              fontSize: '13px',
              backgroundColor: theme => theme.palette.primary.main,
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
              borderColor: theme => theme.palette.primary.main,
              height: "20px",
            }}
          >
            {fieldType.name}
          </Typography>
          <List
            className={fieldType.nameClass}
            disablePadding
            sx={{
              mb: "10px",
              minHeight: '50px',
              maxHeight: "300px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {(() => {
              const showOnlySelected = filterFields.find((f) => f.id === "selected")?.isActive ?? false;
              const q = (searchText || "").trim().toLowerCase();
              const filtered = fieldsList
                .filter((field) => (field.type || (field.is_dimension ? "dimension" : "measure")) === fieldType.id)
                .filter((field) => {
                  if (!showOnlySelected) return true;
                  return selectedFields.some((f) => (f.field_id ?? f.id) === field.id);
                })
                .filter((field) => {
                  if (!q) return true;
                  const name = (field.name ?? "").toLowerCase();
                  return name.includes(q);
                });
              if (filtered.length === 0) {
                return (
                  <Typography variant="body2" sx={{ fontSize: "12px", textAlign: "center", py: 2, color: "text.secondary" }}>
                    No hay campos disponibles
                  </Typography>
                );
              }
              return filtered.map((field, index) => (
                <DraggableField
                  key={field.id ?? index}
                  field={field}
                  isActive={selectedFields.some((f) => (f.field_id ?? f.id) === field.id)}
                  onClick={() => handleFieldClick(field)}
                  nameClass={fieldType.nameClass}
                />
              ));
            })()}
          </List>
        </Paper>
      ))}
      {!isLoadingFields && (!fieldsList || fieldsList.length === 0) && (
        <Typography variant="body2" sx={{ fontSize: "12px", textAlign: "center", mt: 2, color: "text.secondary" }}>
          No hay campos disponibles
        </Typography>
      )}
    </Box >
  )
}

function DraggableField({ field, onClick, isActive = false, nameClass }) {
  const theme = useTheme()
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "field",
    item: field,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))
  return (
    <Tooltip
      title={<FieldTooltipContent field={field} />}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: (() => {
                  if (!nameClass) return [0, 0];
                  const popperParent = document.querySelector(`.${nameClass}`);
                  if (popperParent && popperParent.scrollHeight > popperParent.clientHeight) {
                    return [0, 12];
                  } else {
                    return [0, -5];
                  }
                })(),
              },
            },
          ],
        },
      }}
      placement="right"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 3,
            borderRadius: 1,
            p: 0,
            maxWidth: "none"
          },
        }
      }}

    >
      <ListItem
        ref={drag}
        onClick={onClick}
        sx={{
          p: 0.8,
          cursor: "pointer",
          opacity: isDragging ? 0.5 : 1,
          "&:hover": {
            backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.2) : alpha(
              theme.palette.primary.main,
              getContrastColor(theme.palette.primary.main) == '#000000' ? 0.3 : 0.1
            ),
          },
          borderRadius: "20px",
          mb: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.2) : "transparent",
          maxHeight: "33px",
          width: "92%"
        }}
      >
        <Box>
          {field.type === "dimension" ? (
            <Avatar
              sx={{
                width: 22,
                height: 22,
                backgroundColor: !isActive ? alpha(
                  theme.palette.primary.main,
                  getContrastColor(theme.palette.primary.main) == '#000000' ? 0.3 : 0.1
                ) : theme => theme.palette.primary.main,
                color: !isActive ? theme => theme.palette.primary.main : "#FFFFFF",
                mr: 0.5,
                fontSize: '9px'
              }}
            >
              {"abc"}
            </Avatar>
          ) : (
            <Avatar
              sx={{
                width: 22,
                height: 22,
                backgroundColor: !isActive ? alpha(
                  theme.palette.primary.main,
                  getContrastColor(theme.palette.primary.main) == '#000000' ? 0.3 : 0.1
                ) : theme => theme.palette.primary.main,
                color: !isActive ? theme => theme.palette.primary.main : "#FFFFFF",
                mr: 0.5,
                fontSize: '9px'
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
        </Box>
      </ListItem>
    </Tooltip>
  )
}
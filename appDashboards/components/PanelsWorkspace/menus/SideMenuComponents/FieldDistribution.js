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
} from '@mui/material';
import {
  TableRowsRounded,
  ViewColumnRounded,
  LocalOfferRounded,
  MoreVert
} from '@mui/icons-material';


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
        {field.is_dimensions ? (
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
      <IconButton size="small" onClick={handleClick}>
        <MoreVert sx={{ fontSize: '15px', color: theme.palette.primary.main }} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>Cambiar</MenuItem>
        <MenuItem onClick={handleClose}>Eliminar</MenuItem>
      </Menu>
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
        maxHeight: "200px",
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


export const FieldDistribution = (props) => {

  const [rowFields, setRowFields] = useState([]);
  const [columnFields, setColumnFields] = useState([]);
  const [attributeFields, setAttributeFields] = useState([]);
  const [delayedLoading, setDelayedLoading] = useState(false);
  const isLoading = props?.panel?.state?.isLoadingFieldsDistribution;

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
    if (props?.panel?.queryParameters?.fields_distribution) {
      const { row_fields, column_fields, attribute_fields } = props.panel.queryParameters.fields_distribution;
      setRowFields(row_fields || []);
      setColumnFields(column_fields || []);
      setAttributeFields(attribute_fields || []);
    } else {
      setRowFields([]);
      setColumnFields([]);
      setAttributeFields([]);
    }
  }, [props?.panel?.queryParameters?.fields_distribution]);

  return (
    <Box sx={{ width: "155px" }}>
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

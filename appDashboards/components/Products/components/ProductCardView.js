import { Card, Tooltip, CardMedia, CardContent, Box, Button, Typography, useMediaQuery, Grid, CardActionArea, lighten, darken, Chip, CardActions, CardHeader, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Snackbar, Alert } from '@mui/material';
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DatasetIcon from '@mui/icons-material/Dataset';
import ScreenSearchDesktopIcon from '@mui/icons-material/ScreenSearchDesktop';
import JoinFullIcon from '@mui/icons-material/JoinFull';
import StorageIcon from '@mui/icons-material/Storage';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MemoryIcon from '@mui/icons-material/Memory';
import { PieChart, MoreVert, ContentCopy, EditOffOutlined } from "@mui/icons-material";
import BarChartIcon from '@mui/icons-material/BarChart';

const TOOLTIP_SX = {
  bgcolor: '#666666',
  color: '#ffff',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  borderRadius: '0.5rem',
  fontSize: '0.9rem',
  lineHeight: 1.6,
  padding: '15px',
  fontWeight: '500',
};

const PRODUCTS_MEDIA = {
  "dashboard": { 
    "icon": <DashboardIcon />
   },
  "data_set": { 
    "icon": <DatasetIcon /> 
  },
  "data_source": {
     "icon": <StorageIcon />
     },
  "file": { 
    "icon": <InsertDriveFileIcon />
   },
  "panel": {
     "icon": <BarChartIcon />
     },
  "pipeline": {
     "icon": <AccountTreeIcon /> 
    },
  "pipeline_component": {
     "icon": <MemoryIcon />
     },
  "query": { 
    "icon": <JoinFullIcon />
   },
  "search_engine": { "icon": <ScreenSearchDesktopIcon /> },
};
const TruncatedTitle = ({ name, setTooltipOpen }) => {
  const textRef = useRef(null);

  const handleMouseEnter = () => {
    if (textRef.current) {
      const isTruncated = textRef.current.scrollHeight > textRef.current.clientHeight + 2;
      if (isTruncated) {
        setTooltipOpen(true);
      }
    }
  };

  const handleMouseLeave = () => {
    setTooltipOpen(false);
  };

  return (
    <Typography
      ref={textRef}
      variant="h5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        wordBreak: 'break-word',
        lineHeight: 1.5,
        textAlign: 'left',
      }}
    >
      {name}
    </Typography>
  );
};

const ProductCardView = ({ product, onEnter, onToggleFavorite, onShare, setShowCopiedAlert }) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const getProductIcon = () => {
    if (product.type === 'dashboard') {
      return <SpaceDashboardIcon sx={{ fontSize: 60, color: 'black' }} />;
    } else if (product.type === 'panel') {
      return <PieChart sx={{ fontSize: 60, color: 'black' }} />;
    }
    return <SpaceDashboardIcon sx={{ fontSize: 60, color: 'black' }} />;
  };

  const testImageURL = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
    } catch {
      return false;
    }
    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // const handleShare = (e) => {
  //   e.stopPropagation();
  //   onShare(product);
  //   setShowCopiedAlert(true);
  //   handleMenuClose();
  // };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    onToggleFavorite(product.id);
    handleMenuClose();
  };

  return (
    <Card
      onClick={() => onEnter(product)}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        cursor: "pointer",
        willChange: "transform",
        "&:hover": {
          transform: "scale(1.015)",
        },
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(to right, ${theme.palette.primary.main}, ${lighten(theme.palette.primary.main, 0.3)}, ${theme.palette.primary.main})`,
          opacity: 0,
          transition: 'opacity 0.2s ease',
          zIndex: 1,
        },
        "&:hover::before": {
          opacity: 1,
        },
        border: "1px solid #e0e0e0",
      }}
      elevation={0}
    >
      <Tooltip
        title={product.name}
        placement="bottom"
        open={isTooltipOpen}
        disableHoverListener
        disableFocusListener
        disableTouchListener
        slotProps={{ tooltip: { sx: TOOLTIP_SX } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {testImageURL(product.url_image) && !imageError ? (
            <CardMedia
              component="img"
              height="150"
              image={product.url_image}
              sx={{
                 objectFit: 'contain',
                 }}
              alt={product.name}
              onError={() => setImageError(true)}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "150px",
                backgroundColor: "primary.light",
                opacity: 0.1,
              }}
            >
              {getProductIcon()}
            </Box>
          )}
          <CardHeader
            title={<TruncatedTitle name={product.name} setTooltipOpen={setIsTooltipOpen} />}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {product.can_edit === false && (
                  <Tooltip
                    title="Sin permisos de edición"
                    placement="top"
                    slotProps={{ tooltip: { sx: TOOLTIP_SX } }}
                  >
                    <EditOffOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </Tooltip>
                )}
                {/* <IconButton onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClick(e);
                }}>
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={(e) => {
                    e.stopPropagation();
                    handleMenuClose();
                  }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
                  onClick={(e) => e.stopPropagation()}
                >
              {/* {
              <MenuItem onClick={handleToggleFavorite}>
                
                <ListItemIcon>
                  {product.favorite ? <Star color="warning" /> : <StarBorder />}
                </ListItemIcon>
                <ListItemText>
                  {product.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                </ListItemText>
                
              </MenuItem>
              */}
                  {/* <MenuItem onClick={handleShare}>
                    <ListItemIcon>
                      <ContentCopy />
                    </ListItemIcon>
                    <ListItemText>Compartir</ListItemText>
                  </MenuItem> */}
                {/* </Menu> */} 
              </Box>
            }
          />


          <CardContent sx={{ flexGrow: 1, px: 2, py: 0 }}>
            <Box sx={{ mb: 1 }}>
              {product.project && (
                <Chip
                  label={product.project}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: "0.75rem", height: 24 }}
                />
              )}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.5, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}
            >
              {product.description || "Descripción no disponible"}
            </Typography>
          </CardContent>
        </Box>
      </Tooltip>
    </Card>
  );
};

export default ProductCardView;
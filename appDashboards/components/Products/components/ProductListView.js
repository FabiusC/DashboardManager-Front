import {
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Box,
  Typography,
} from '@mui/material';
import { useRef, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import PieChart from '@mui/icons-material/PieChart';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';

const ProductListView = ({ product, onEnter }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (container && text) {
      setShouldScroll(text.scrollWidth > container.clientWidth);
    }
  }, [product.name]);

  // Function to get the appropriate icon based on product type
  const getProductIcon = () => {
    if (product.type === 'dashboard') {
      return <SpaceDashboardIcon sx={{ fontSize: 40, color: 'black' }} />;
    } else if (product.type === 'panel') {
      return <PieChart sx={{ fontSize: 40, color: 'black' }} />;
    }
    // Default icon for other types
    return <SpaceDashboardIcon sx={{ fontSize: 40, color: 'black' }} />;
  };

  return (
    <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
      <CardActionArea onClick={onEnter} sx={{ px: 1, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              backgroundColor: '#f9fafd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2
            }}
          >
            {getProductIcon()}
          </Box>
          <CardContent sx={{ flex: 1, py: 2 }}>
            <Box
              ref={containerRef}
              sx={{
                width: '100%',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              <Typography
                ref={textRef}
                className="scroll-text"
                variant="h6"
                sx={{
                  display: 'inline-block',
                  paddingRight: shouldScroll ? '100%' : 0,
                  fontSize: {
                    xs: '0.9rem',
                    sm: '1rem',
                    md: '1.1rem',
                    lg: '1.25rem',
                  },
                }}
              >
                {product.name}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { md: 'block', xs: 'none' } }}
            >
              {product.description || 'Descripción no disponible'}
            </Typography>
          </CardContent>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default ProductListView;

import { Box, Button, Badge } from '@mui/material';
import { FilterAlt } from '@mui/icons-material';


const buttonContainerStyles = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 1000,
  animation: 'fadeInBounce 0.5s ease-out',
  '@keyframes fadeInBounce': {
    '0%': {
      opacity: 0,
      transform: 'scale(0.3) translateY(20px)'
    },
    '50%': {
      transform: 'scale(1.05)'
    },
    '100%': {
      opacity: 1,
      transform: 'scale(1) translateY(0)'
    }
  }
};

const badgeStyles = {
  '& .MuiBadge-badge': {
    fontSize: '0.75rem',
    height: '22px',
    minWidth: '22px',
    padding: '0 6px',
    fontWeight: 600,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  }
};


const floatingButtonStyles = {
  minWidth: 'auto',
  width: 56,
  height: 56,
  borderRadius: '50%',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  backgroundColor: theme => theme.palette.primary.main,
  '&:hover': {
    backgroundColor: theme => theme.palette.primary.dark,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    transform: 'scale(1.05)',
  },
  transition: 'all 0.2s ease-in-out',
};

const FilterFloatingButton = ({ activeRulesCount, onClick }) => {
  return (
    <Box sx={buttonContainerStyles}>
      <Badge badgeContent={activeRulesCount} color="error" sx={badgeStyles}>
        <Button
          onClick={onClick}
          variant="contained"
          sx={floatingButtonStyles}
        >
          <FilterAlt sx={{ fontSize: 28, color: 'white' }} />
        </Button>
      </Badge>
    </Box>
  );
};

export default FilterFloatingButton;


import { Box, Typography, Button } from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import BaseDialog from './BaseDialog';

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmación',
  description,
  confirmLabel = 'Aceptar',
  cancelLabel  = 'Cancelar',
  // apariencia
  icon = <WarningRoundedIcon color="warning" fontSize="medium" />,
}) {
  return (
    <BaseDialog open={open} onClose={onClose} maxWidth="xs">
      <Box className="pad_35">
        <Typography variant="h6" sx={{ fontWeight: 500, px: 2, py: 1 }}>
          {icon} {title}
        </Typography>

        <Box className="pad_20">
          <Box className="pad_40 bg_white_op_245">
            <Typography sx={{ textAlign: 'justify', fontWeight: 500, mb: 1 }}>
              {description}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1, gap: 1 }}>
          <Button variant="outlined" color="error" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="contained" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Box>
      </Box>
    </BaseDialog>
  );
}
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Warning, Save } from "@mui/icons-material";

const UnsavedChangesModalView = ({ open, onClose, onAccept, actionName, isSaving = false }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1.5 }}>
        <Warning color="warning" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Cambios sin guardar
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1">
          Tienes cambios sin guardar. ¿Quieres guardar antes de {actionName}?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isSaving}
          sx={{ textTransform: 'none' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onAccept}
          variant="contained"
          disabled={isSaving}
          startIcon={
            isSaving ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Save sx={{ fontSize: 18 }} />
            )
          }
          sx={{ textTransform: 'none' }}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsavedChangesModalView;


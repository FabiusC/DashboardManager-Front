import Dialog from '@mui/material/Dialog'; 

export default function BaseDialog({
  open,
  onClose,
  maxWidth = 'md',
  fullWidth = true,
  sx = {},
  children,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      sx={{
        '& .MuiDialog-paper': { width: '100%', ...sx },
      }}
    >
      {children}
    </Dialog>
  );
}
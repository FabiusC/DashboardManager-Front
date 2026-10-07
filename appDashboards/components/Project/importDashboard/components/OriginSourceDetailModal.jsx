import React from 'react';
import {
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';

export default function OriginSourceDetailModal({
    open,
    onClose,
    originName,
    fieldNames = [],
    panelItems = []
}) {
    const panelCount = panelItems.length;
    const fieldCount = fieldNames.length;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            <DialogTitle sx={{ pr: 6, pb: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <StorageIcon color="primary" />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {originName || 'Fuente de origen'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Detalle del tablero importado
                        </Typography>
                    </Box>
                </Stack>
                <IconButton
                    aria-label="Cerrar"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 12, top: 12 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`${panelCount} ${panelCount === 1 ? 'panel' : 'paneles'}`} />
                    <Chip size="small" label={`${fieldCount} ${fieldCount === 1 ? 'campo' : 'campos'}`} />
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Paneles que usan esta fuente
                </Typography>
                {panelCount === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No se encontraron paneles asociados en el archivo.
                    </Typography>
                ) : (
                    <List dense disablePadding sx={{ mb: 2 }}>
                        {panelItems.map((item) => (
                            <ListItem
                                key={item.ref}
                                alignItems="flex-start"
                                sx={{
                                    px: 0,
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <ListItemText
                                    primary={item.title}
                                    secondary={
                                        <>
                                            {item.description ? (
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    display="block"
                                                >
                                                    {item.description}
                                                </Typography>
                                            ) : null}
                                            {item.chart_type ? (
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Tipo: {item.chart_type}
                                                </Typography>
                                            ) : null}
                                        </>
                                    }
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
        </Dialog>
    );
}

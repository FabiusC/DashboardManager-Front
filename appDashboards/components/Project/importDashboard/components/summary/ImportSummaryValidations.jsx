import React from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';

function ValidationItem({ label }) {
    return (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
            <Box
                sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'common.white'
                }}
            >
                <CheckIcon sx={{ fontSize: 14 }} />
            </Box>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                {label}
            </Typography>
        </Stack>
    );
}

export default function ImportSummaryValidations({ items }) {
    return (
        <Box
            sx={(theme) => ({
                width: '100%',
                p: 2.25,
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.12),
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                boxSizing: 'border-box'
            })}
        >
            <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: 'block', fontWeight: 600, letterSpacing: '0.1em', mb: 1.5 }}
            >
                Validaciones
            </Typography>
            <Grid container spacing={1.5}>
                {items.map((item) => (
                    <Grid item xs={12} md={4} key={item}>
                        <ValidationItem label={item} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

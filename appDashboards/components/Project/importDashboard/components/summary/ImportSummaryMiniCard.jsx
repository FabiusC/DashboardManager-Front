import React from 'react';
import { Box, Card, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

export default function ImportSummaryMiniCard({ icon: Icon, label, value, meta }) {
    return (
        <Card
            elevation={0}
            sx={(theme) => ({
                width: '100%',
                height: '100%',
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            })}
        >
            <Stack direction="row" spacing={1.3} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
                <Box
                    sx={(theme) => ({
                        width: 35,
                        height: 35,
                        borderRadius: 1.35,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main'
                    })}
                >
                    <Icon sx={{ fontSize: 20 }} />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            display: 'block',
                            fontWeight: 400,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            lineHeight: 1.3,
                            mb: 0.25
                        }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                        title={value}
                    >
                        {value}
                    </Typography>
                    {meta ? (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                display: 'block',
                                mt: 0.25,
                                fontWeight: 400,
                                fontSize: '0.78rem',
                                lineHeight: 1.35,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                            title={meta}
                        >
                            {meta}
                        </Typography>
                    ) : null}
                </Box>
            </Stack>
        </Card>
    );
}

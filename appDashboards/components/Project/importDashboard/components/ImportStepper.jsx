import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

function StepIcon({ step, active, completed }) {
    const Icon = step.icon;

    return (
        <Box
            sx={(theme) => ({
                width: 16,
                height: 16,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: active ? 'common.white' : alpha(theme.palette.text.secondary, 0.75),
                backgroundColor: active
                    ? alpha(theme.palette.common.white, 0.18)
                    : completed
                    ? alpha(theme.palette.primary.main, 0.14)
                    : alpha(theme.palette.text.primary, 0.04)
            })}
        >
            {completed ? (
                <CheckRoundedIcon sx={{ fontSize: 12, color: 'primary.main' }} />
            ) : (
                <Icon sx={{ fontSize: 11 }} />
            )}
        </Box>
    );
}

function ImportStepper({ steps, activeStep }) {
    return (
        <Box
            sx={{
                width: '100%',
                minWidth: 0,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center'
            }}
        >
            {steps.map((step, index) => {
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;

                return (
                    <React.Fragment key={step.label}>
                        <Box
                            sx={(theme) => ({
                                minHeight: 31,
                                px: 1.2,
                                py: 0.55,
                                borderRadius: 999,
                                border: `1px solid ${
                                    isActive
                                        ? theme.palette.primary.main
                                        : isCompleted
                                        ? alpha(theme.palette.primary.main, 0.32)
                                        : alpha(theme.palette.text.primary, 0.10)
                                }`,
                                backgroundColor: isActive ? 'primary.main' : 'background.paper',
                                boxShadow: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.65,
                                flexShrink: 0,
                                transition: 'all 180ms ease'
                            })}
                        >
                            <StepIcon step={step} active={isActive} completed={isCompleted} />
                            <Typography
                                variant="caption"
                                sx={(theme) => ({
                                    fontSize: 11,
                                    lineHeight: 1,
                                    color: isActive
                                        ? 'common.white'
                                        : isCompleted
                                        ? 'primary.main'
                                        : alpha(theme.palette.text.secondary, 0.92),
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap'
                                })}
                            >
                                {step.label}
                            </Typography>
                        </Box>

                        {index < steps.length - 1 && (
                            <Box
                                sx={(theme) => ({
                                    height: '1px',
                                    flex: 1,
                                    minWidth: 18,
                                    mx: 0.5,
                                    alignSelf: 'center',
                                    transform: 'scaleY(0.5)',
                                    transformOrigin: 'center',
                                    backgroundColor: alpha(theme.palette.text.primary, 0.06)
                                })}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </Box>
    );
}

export default ImportStepper;

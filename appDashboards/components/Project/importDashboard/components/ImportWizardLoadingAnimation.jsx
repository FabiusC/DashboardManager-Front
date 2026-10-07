import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';

const MSG_INTERVAL_MS = 1600;

const pulseRing = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(1.45); opacity: 0; }
`;

const orbitParticle = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg) translateX(52px) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg) translateX(52px) rotate(-360deg); }
`;

const floatSlow = keyframes`
  0%, 100% { transform: translate(-50%, -50%) translateY(0) rotate(-2deg); }
  50% { transform: translate(-50%, -50%) translateY(-8px) rotate(2deg); }
`;

const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const iconPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

const shimmerMove = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export default function ImportWizardLoadingAnimation({
    centerIcon: CenterIcon,
    messages,
    footnote = 'Esto puede tardar unos segundos',
    lightText = false,
    onCancel,
    cancelLabel = 'Cancelar exportación'
}) {
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        if (!messages?.length) return undefined;
        const id = window.setInterval(() => {
            setMsgIndex((i) => (i + 1) % messages.length);
        }, MSG_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [messages]);

    const { Icon, text } = useMemo(() => messages[msgIndex] || messages[0], [messages, msgIndex]);

    return (
        <Stack
            spacing={2}
            alignItems="center"
            sx={{
                py: 0,
                px: 0.5,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                flexShrink: 0
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: 180,
                    height: 180,
                    mx: 'auto',
                    flexShrink: 0
                }}
            >
                {[0.2, 0.15, 0.1].map((bgAlpha, i) => (
                    <Box
                        key={String(bgAlpha)}
                        sx={(theme) => ({
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: 88,
                            height: 88,
                            zIndex: 0,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.primary.main, bgAlpha),
                            animation: `${pulseRing} 2s ease-out infinite`,
                            animationDelay: `${i * 0.6}s`,
                            pointerEvents: 'none'
                        })}
                    />
                ))}

                <Box
                    sx={(theme) => ({
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 2.5,
                        height: 2.5,
                        zIndex: 1,
                        borderRadius: '50%',
                        bgcolor: theme.palette.primary.main,
                        animation: `${orbitParticle} 4s linear infinite`,
                        animationDelay: '-0.4s',
                        pointerEvents: 'none'
                    })}
                />
                <Box
                    sx={(theme) => ({
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 2,
                        height: 2,
                        zIndex: 1,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.75),
                        animation: `${orbitParticle} 5s linear infinite`,
                        animationDelay: '-1.1s',
                        pointerEvents: 'none'
                    })}
                />
                <Box
                    sx={(theme) => ({
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 1.5,
                        height: 1.5,
                        zIndex: 1,
                        borderRadius: '50%',
                        bgcolor:
                            theme.palette.secondary && theme.palette.secondary.main
                                ? alpha(theme.palette.secondary.main, 0.95)
                                : alpha(theme.palette.primary.light, 0.95),
                        animation: `${orbitParticle} 6s linear infinite`,
                        animationDelay: '-2.2s',
                        pointerEvents: 'none'
                    })}
                />

                <Box
                    sx={(theme) => ({
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 80,
                        height: 80,
                        zIndex: 2,
                        borderRadius: 2.5,
                        background: `linear-gradient(145deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                        boxShadow: `0 0 24px ${alpha(theme.palette.primary.main, 0.42)}`,
                        display: 'grid',
                        placeItems: 'center',
                        animation: `${floatSlow} 6s ease-in-out infinite`,
                        pointerEvents: 'none'
                    })}
                >
                    <CenterIcon sx={{ fontSize: 38, color: 'common.white' }} />
                </Box>
            </Box>

            <Stack spacing={1.25} alignItems="center" sx={{ maxWidth: 360, textAlign: 'center', px: 1 }}>
                <Box
                    key={text}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        animation: `${fadeUp} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both`
                    }}
                >
                    <Icon
                        sx={{
                            fontSize: 22,
                            color: lightText ? 'common.white' : 'primary.main',
                            animation: `${iconPulse} 1.4s ease-in-out infinite`
                        }}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            lineHeight: 1.4,
                            color: lightText ? 'common.white' : 'text.primary'
                        }}
                    >
                        {text}
                    </Typography>
                </Box>

                <Box
                    sx={(theme) => {
                        const orgPrimary = theme.palette.primary.main;
                        return {
                            width: '100%',
                            maxWidth: 256,
                            height: 6,
                            borderRadius: 999,
                            bgcolor: lightText
                                ? alpha(orgPrimary, 0.22)
                                : alpha(orgPrimary, 0.1),
                            overflow: 'hidden',
                            position: 'relative'
                        };
                    }}
                >
                    <Box
                        sx={(theme) => {
                            const orgPrimary = theme.palette.primary.main;
                            return {
                                height: '100%',
                                width: '100%',
                                background: `linear-gradient(90deg, 
                transparent 0%, 
                ${alpha(orgPrimary, 0)} 32%, 
                ${alpha(orgPrimary, lightText ? 0.95 : 0.55)} 50%, 
                ${alpha(orgPrimary, 0)} 68%, 
                transparent 100%)`,
                                backgroundSize: '200% 100%',
                                animation: `${shimmerMove} 1.8s linear infinite`
                            };
                        }}
                    />
                </Box>

                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 400,
                        color: lightText ? 'rgba(255, 255, 255, 0.72)' : 'text.secondary'
                    }}
                >
                    {footnote}
                </Typography>

                {onCancel && (
                    <Button
                        variant="text"
                        onClick={onCancel}
                        aria-label={cancelLabel}
                        sx={{
                            mt: 0.25,
                            minWidth: 0,
                            px: 1.5,
                            py: 0.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            color: lightText ? 'rgba(255, 255, 255, 0.88)' : 'text.secondary',
                            borderRadius: 2,
                            '&:hover': {
                                bgcolor: lightText ? alpha('#fff', 0.08) : 'action.hover',
                                textDecoration: 'underline',
                                textUnderlineOffset: 3
                            }
                        }}
                    >
                        {cancelLabel}
                    </Button>
                )}
            </Stack>
        </Stack>
    );
}

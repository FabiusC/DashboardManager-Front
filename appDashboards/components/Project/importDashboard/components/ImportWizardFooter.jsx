import React from 'react';
import { Box, Button } from '@mui/material';
import {
    WIZARD_BACK_BUTTON_SX,
    WIZARD_CONTINUE_BUTTON_SX,
    WIZARD_FOOTER_LAYOUT_SX
} from '../constants/wizardFooterStyles';

export default function ImportWizardFooter({
    showBack = true,
    backLabel = 'Volver',
    onBack,
    backDisabled = false,
    continueLabel = 'Continuar',
    onContinue,
    continueDisabled = false,
    continueLoading = false,
    showSecondaryContinue = false,
    secondaryContinueLabel = '',
    onSecondaryContinue,
    secondaryContinueDisabled = false,
    centerContent = null,
    centerInline = false,
    continueOnly = false
}) {
    const layoutSx = continueOnly
        ? { ...WIZARD_FOOTER_LAYOUT_SX, justifyContent: 'flex-end' }
        : WIZARD_FOOTER_LAYOUT_SX;

    if (centerContent && centerInline) {
        return (
            <Box
                sx={{
                    ...layoutSx,
                    flexWrap: 'wrap',
                    rowGap: 1,
                    pt: 0.5,
                    flexShrink: 0
                }}
            >
                {showBack ? (
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={onBack}
                        disabled={backDisabled || continueLoading}
                        sx={WIZARD_BACK_BUTTON_SX}
                    >
                        {backLabel}
                    </Button>
                ) : (
                    <Box sx={{ minWidth: 148, display: { xs: 'none', sm: 'block' } }} />
                )}
                <Box
                    sx={{
                        flex: '1 1 160px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: 0,
                        px: { xs: 0, sm: 1 }
                    }}
                >
                    {centerContent}
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onContinue}
                    disabled={continueDisabled || continueLoading}
                    sx={WIZARD_CONTINUE_BUTTON_SX}
                >
                    {continueLabel}
                </Button>
            </Box>
        );
    }

    if (centerContent) {
        return (
            <Box sx={{ width: '100%', flexShrink: 0, pt: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, minWidth: 0 }}>
                    {centerContent}
                </Box>
                <Box sx={layoutSx}>
                    {showBack ? (
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={onBack}
                            disabled={backDisabled || continueLoading}
                            sx={WIZARD_BACK_BUTTON_SX}
                        >
                            {backLabel}
                        </Button>
                    ) : (
                        <Box sx={{ minWidth: 148, display: { xs: 'none', sm: 'block' } }} />
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onContinue}
                        disabled={continueDisabled || continueLoading}
                        sx={WIZARD_CONTINUE_BUTTON_SX}
                    >
                        {continueLabel}
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={layoutSx}>
            {showBack ? (
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={onBack}
                    disabled={backDisabled || continueLoading}
                    sx={WIZARD_BACK_BUTTON_SX}
                >
                    {backLabel}
                </Button>
            ) : (
                <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 148 }} />
            )}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'stretch',
                    gap: 1.5,
                    width: { xs: '100%', sm: 'auto' }
                }}
            >
                {showSecondaryContinue && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onSecondaryContinue}
                        disabled={secondaryContinueDisabled || continueLoading}
                        sx={WIZARD_CONTINUE_BUTTON_SX}
                    >
                        {secondaryContinueLabel}
                    </Button>
                )}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onContinue}
                    disabled={continueDisabled || continueLoading}
                    sx={WIZARD_CONTINUE_BUTTON_SX}
                >
                    {continueLabel}
                </Button>
            </Box>
        </Box>
    );
}

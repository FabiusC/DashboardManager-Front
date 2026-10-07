import React from 'react';
import { Box } from '@mui/material';
import StepUpload from '../steps/StepUpload';
import StepSelectPath from '../steps/StepSelectPath';
import StepValidateSources from '../steps/StepValidateSources';
import StepCreateDashboard from '../steps/StepCreateDashboard';
import { useWizard } from '../hooks/useWizard';
import ImportStepper from './ImportStepper';
import WizardActions from './WizardActions';
import { IMPORT_DASHBOARD_STEPS } from '../constants/importDashboardSteps';
import { WIZARD_FOOTER_WRAPPER_COMPACT_SX, WIZARD_FOOTER_WRAPPER_SX } from '../constants/wizardFooterStyles';

function ImportDashboardWizard() {
    const { activeStep } = useWizard();

    const renderStepContent = () => {
        if (activeStep === 0) {
            return <StepUpload />;
        }

        if (activeStep === 1) {
            return <StepValidateSources />;
        }

        if (activeStep === 2) {
            return <StepSelectPath />;
        }

        if (activeStep === 3) {
            return <StepCreateDashboard />;
        }

        return null;
    };

    const showWizardActions = activeStep !== 2 && activeStep !== 3;
    const isCompactLayoutStep = activeStep === 1 || activeStep === 2;

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}
        >
            <Box sx={{ flexShrink: 0, px: 3, pt: 3, pb: 2 }}>
                <ImportStepper steps={IMPORT_DASHBOARD_STEPS} activeStep={activeStep} />
            </Box>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: isCompactLayoutStep ? 'hidden' : 'auto',
                    overflowX: 'hidden',
                    px: 3,
                    pt: isCompactLayoutStep ? 2 : 3,
                    pb: isCompactLayoutStep ? 1 : 2,
                    boxSizing: 'border-box'
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                        '& > *': {
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                        }
                    }}
                >
                    {renderStepContent()}
                </Box>
            </Box>

            {showWizardActions && (
                <Box
                    sx={{
                        ...(activeStep === 1 ? WIZARD_FOOTER_WRAPPER_COMPACT_SX : WIZARD_FOOTER_WRAPPER_SX),
                        px: 3,
                        flexShrink: 0
                    }}
                >
                    <WizardActions />
                </Box>
            )}
        </Box>
    );
}

export default ImportDashboardWizard;

import React from 'react';
import { useWizard } from '../hooks/useWizard';
import ImportWizardFooter from './ImportWizardFooter';

function WizardActions() {
    const { activeStep, nextStep, prevStep, wizardActions } = useWizard();

    const handleBack = () => {
        if (wizardActions.onBack) {
            wizardActions.onBack();
            return;
        }
        prevStep();
    };

    const handleContinue = () => {
        if (wizardActions.onContinue) {
            wizardActions.onContinue();
            return;
        }
        nextStep();
    };

    return (
        <ImportWizardFooter
            continueOnly={activeStep === 0}
            showBack={activeStep > 0}
            backLabel="Volver"
            onBack={handleBack}
            backDisabled={wizardActions.isLoading}
            continueLabel={wizardActions.continueLabel}
            onContinue={handleContinue}
            continueDisabled={wizardActions.continueDisabled}
            continueLoading={wizardActions.isLoading}
        />
    );
}

export default WizardActions;

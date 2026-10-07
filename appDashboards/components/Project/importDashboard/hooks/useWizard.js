import { useContext } from 'react';
import { WizardContext } from '../context/WizardContext';

export const useWizard = () => {
    const context = useContext(WizardContext);
    return context;
};
import React, { createContext, useCallback, useMemo, useState } from 'react'

export const WizardContext = createContext(null)

const DEFAULT_ACTIONS = {
    continueLabel: 'Continuar',
    continueDisabled: false,
    isLoading: false,
    onContinue: null,
    onBack: null
}

export const WizardProvider = ({ children }) => {
    const [activeStep, setActiveStep] = useState(0)
    const [wizardActions, setWizardActions] = useState(DEFAULT_ACTIONS)
    const [wizardData, setWizardData] = useState({
        unzippedData: null,
        uploadedFile: null,
        importDestination: null,
        importDashboardSource: null,
        importDatasourceMappings: null,
        isCreating: false,
        result: null
    })

    const nextStep = useCallback(() => setActiveStep((prev) => prev + 1), [])
    const prevStep = useCallback(() => setActiveStep((prev) => Math.max(prev - 1, 0)), [])

    const updateWizardData = useCallback((newData) => {
        setWizardData((prev) => ({
            ...prev,
            ...newData
        }))
    }, [])

    const updateWizardActions = useCallback((newActions) => {
        setWizardActions((prev) => ({
            ...prev,
            ...newActions
        }))
    }, [])

    const resetWizardActions = useCallback(() => {
        setWizardActions(DEFAULT_ACTIONS)
    }, [])

    const resetWizardData = useCallback(() => {
        setActiveStep(0)
        setWizardActions(DEFAULT_ACTIONS)
        setWizardData({
            unzippedData: null,
            uploadedFile: null,
            importDestination: null,
            importDashboardSource: null,
            importDatasourceMappings: null,
            isCreating: false,
            result: null
        })
    }, [])

    const value = useMemo(() => ({
        nextStep,
        prevStep,
        activeStep,
        wizardData,
        wizardActions,
        updateWizardData,
        updateWizardActions,
        resetWizardActions,
        resetWizardData
    }), [
        activeStep,
        nextStep,
        prevStep,
        resetWizardActions,
        resetWizardData,
        updateWizardActions,
        updateWizardData,
        wizardActions,
        wizardData
    ])

    return (
        <WizardContext.Provider value={value}>
            {children}
        </WizardContext.Provider>
    )

}
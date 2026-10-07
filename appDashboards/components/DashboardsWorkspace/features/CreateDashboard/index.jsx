import { Dialog } from '@mui/material';
import { useCreateDashboard } from './hooks/useCreateDashboard';
import CreateDashboardView from './components/CreateDashboardView';

const CreateDashboard = ({ open, onClose, ...props }) => {
    const logic = useCreateDashboard({ ...props, setIsCreateModal: onClose });

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            sx={{
                '& .MuiDialog-paper': {
                    maxWidth: '900px',
                    width: '100%',
                }
            }}
        >
            <CreateDashboardView 
                isRedirecting={logic.states.isRedirecting}
                isLoadingData={logic.states.isLoadingData}
                dynamicFormState={logic.states.dynamicFormState}
                formError={logic.states.formError}
                validationErrors={logic.states.validationErrors}
                formFields={logic.states.baseFormFields}
                isLoadingDataSources={logic.states.isLoadingDataSources}
                isErrorDataSources={logic.states.isErrorDataSources}
                isEmptyDataSources={logic.states.isEmptyDataSources}
                selectedCategories={logic.states.selectedCategories}
                userToken={logic.states.userToken}
                handlers={{
                    onDataChange: logic.actions.handleDataChange,
                    handleFieldChange: logic.actions.handleFieldChange,
                    handleCategoriesChange: logic.actions.handleCategoriesChange,
                    onSubmit: logic.actions.handleCreateDashboard,
                    onClose: logic.actions.handleClose
                }}
            />
        </Dialog>
    );
};

export default CreateDashboard;
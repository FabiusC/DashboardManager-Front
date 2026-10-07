import {
    Box,
    Divider,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Typography,
} from '@mui/material';
import { Storage, Inbox } from '@mui/icons-material';
import { LoadingAssembly } from "@creangel/ifindit-ui";
import { DynamicForm } from "@creangel/ifindit-ui";
import { StyledButton } from "@components/Recursive/mui_styled_components";
import RedirectingLoader from "@components/Recursive/Loaders/RedirectLoaders";
import CreateDashboardCategoriesField from "./CreateDashboardCategoriesField";

const CreateDashboardView = ({
    isRedirecting,
    isLoadingData,
    dynamicFormState,
    formError,
    validationErrors = {},
    formFields = [],
    isLoadingDataSources,
    isErrorDataSources,
    isEmptyDataSources,
    selectedCategories = [],
    originDashboard,
    userToken,
    handlers = {}
}) => {

    if (isRedirecting) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <RedirectingLoader />
            </Box>
        );
    }

    // Show no data rources availables 
    if (!isLoadingDataSources && !isErrorDataSources && isEmptyDataSources) {
        return (
            <Box className="pad_35">
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    py: 6,
                    px: 4
                }}>
                    <Storage
                        sx={{
                            fontSize: 80,
                            color: 'text.secondary',
                            mb: 3,
                            opacity: 0.6
                        }}
                    />
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 500,
                            mb: 2,
                            textAlign: 'center',
                            color: 'text.primary'
                        }}
                    >
                        No hay fuentes de datos disponibles
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            textAlign: 'center',
                            color: 'text.secondary',
                            maxWidth: '500px',
                            mb: 4
                        }}
                    >
                        No se encontraron fuentes de datos en el sistema. Para crear un tablero, primero debe configurar al menos una fuente de datos.
                        <br />
                        <br />
                        Por favor, configure una fuente de datos.
                    </Typography>
                    <StyledButton onClick={handlers?.onClose} variant="outlined">
                        Cerrar
                    </StyledButton>
                </Box>
            </Box>
        );
    }

    return (
        <Box className="pad_35">
            <DialogTitle variant="h6" noWrap component="div" sx={{ fontWeight: "500", marginBottom: "10px" }}>
                Crear nuevo tablero
            </DialogTitle>
            <Divider />

            {isLoadingData ? (
                <LoadingAssembly state={{ message: "Creando tablero...", borderRadius: false, boxShadow: false, size: 60 }} />
            ) : (
                <Box>
                    <DialogContent sx={{ "& .MuiBox-root": { boxSizing: "border-box" } }}>
                        {/* Show error when loading data sources */}
                        {isErrorDataSources && (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 4
                            }}>
                                <Inbox
                                    sx={{
                                        fontSize: 60,
                                        color: 'error.main',
                                        mb: 2,
                                        opacity: 0.7
                                    }}
                                />
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 500,
                                        mb: 1,
                                        textAlign: 'center',
                                        color: 'error.main'
                                    }}
                                >
                                    Error al cargar fuentes de datos
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        textAlign: 'center',
                                        color: 'text.secondary',
                                        maxWidth: '400px'
                                    }}
                                >
                                    No se pudieron cargar las fuentes de datos. Por favor, intente nuevamente.
                                </Typography>
                            </Box>
                        )}

                        {/* Show loading while getting data sources */}
                        {isLoadingDataSources && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <LoadingAssembly state={{ message: "Cargando fuentes de datos...", borderRadius: false, boxShadow: false, size: 40 }} />
                            </Box>
                        )}

                        {!isLoadingDataSources && !isErrorDataSources && (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                                <DynamicForm
                                    state={dynamicFormState.state}
                                    show={dynamicFormState.show}
                                    handlers={handlers}
                                />

                                <CreateDashboardCategoriesField
                                    userToken={userToken}
                                    originDashboard={originDashboard}
                                    value={Array.isArray(selectedCategories) ? selectedCategories : []}
                                    onChange={handlers?.handleCategoriesChange || (() => {})}
                                />

                                {/* Validation error rendering */}
                                {Object.keys(validationErrors).length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        {Object.entries(validationErrors).map(([fieldId, errorMessage]) => {
                                            // Solve field name or use a fallback
                                            const fieldTitle =
                                                formFields?.find((field) => field.id === fieldId)?.title ||
                                                (fieldId === "categories" ? "Categorías" : fieldId);

                                            return (
                                                <Alert key={fieldId} severity="error" sx={{ mb: 1, "& .MuiAlert-message": { fontWeight: 500 } }}>
                                                    <strong>{fieldTitle}:</strong> {errorMessage}
                                                </Alert>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>

                    {formError && (
                        <Box sx={{ px: 3, pb: 2 }}>
                            <Alert severity="error" sx={{ "& .MuiAlert-message": { fontWeight: 500 } }}>
                                {formError}
                            </Alert>
                        </Box>
                    )}

                    <DialogActions>
                        <StyledButton onClick={handlers?.onClose} disabled={isLoadingData}>
                            Cancelar
                        </StyledButton>
                        <StyledButton
                            onClick={handlers?.onSubmit}
                            variant="contained"
                            disabled={isLoadingData || isLoadingDataSources || isEmptyDataSources || isErrorDataSources}
                        >
                            {isLoadingData ? 'Creando...' : 'Crear tablero'}
                        </StyledButton>
                    </DialogActions>
                </Box>
            )}
        </Box>
    );
};

export default CreateDashboardView;
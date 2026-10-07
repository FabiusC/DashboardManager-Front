import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import {
    AccountTree as AccountTreeIcon,
    AccountTreeOutlined,
    CloudUpload,
    DeleteOutlineRounded,
    DeleteRounded
} from '@mui/icons-material';
import { MenuSecondary, Title } from '@creangel/ifindit-ui';
import { useMenuControls } from '@creangel/ifindit-ui/hooks';
import BreadcrumbsNav from '@components/Project/Breadcrumbs';
import { WizardProvider } from './context/WizardContext';
import ImportDashboardWizard from './components/ImportDashboardWizard';

const PROJECTS_ROUTE = '/projects';
const IMPORT_ROUTE = '/projects/importDashboard';
const TRASH_ROUTE = '/trash?from=projects';

function ImportDashboard() {
    const router = useRouter();

    const menuOptions = useMemo(() => [
        {
            label: 'Proyectos',
            value: 'projects',
            icon: <AccountTreeOutlined />,
            iconSelected: <AccountTreeIcon />
        },
        {
            label: 'Importar',
            value: 'import',
            icon: <CloudUpload />,
            iconSelected: <CloudUpload />
        },
        {
            label: 'Papelera',
            value: 'trash',
            icon: <DeleteOutlineRounded />,
            iconSelected: <DeleteRounded />
        }
    ], []);

    const handleOptionClick = useCallback((optionId) => {
        if (optionId === 'projects') {
            router.push(PROJECTS_ROUTE);
        } else if (optionId === 'import') {
            router.push(IMPORT_ROUTE);
        } else if (optionId === 'trash') {
            router.push(TRASH_ROUTE);
        }
    }, [router]);

    const menuConfig = useMemo(() => ({
        state: {
            button: {
                value: '',
                icon: null
            },
            title: {
                value: 'Mis proyectos'
            },
            listOptions: {
                items: menuOptions,
                selectedOption: 'import'
            }
        },
        show: {
            button: false,
            listOptions: true,
            title: true
        },
        handlers: {
            onButtonClick: () => {},
            onListOptionClick: handleOptionClick
        }
    }), [handleOptionClick, menuOptions]);

    const menuSecondaryState = useMenuControls(menuConfig);

    return (
        <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: '200px 1fr' }}
            sx={{ height: '100%' }}
            overflow="hidden"
        >
            <MenuSecondary
                state={menuSecondaryState.state}
                show={menuSecondaryState.show}
                handlers={menuSecondaryState.handlers}
            />

            <Box
                sx={{
                    m: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden'
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                    <Title
                        title="Importar Dashboard"
                        description=""
                        icon={<CloudUpload sx={{ color: 'primary.main' }} />}
                    />
                </Box>

                <Box sx={{ marginBottom: '0.5rem' }}>
                    <BreadcrumbsNav isImportView />
                </Box>

                <Box
                    sx={{
                        backgroundColor: 'white',
                        height: 'calc(100vh - 200px)',
                        minHeight: 'calc(100vh - 200px)',
                        maxHeight: 'calc(100vh - 200px)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        border: '1px solid #e0e0e0',
                        position: 'relative',
                        boxSizing: 'border-box'
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            boxSizing: 'border-box'
                        }}
                    >
                        <WizardProvider>
                            <ImportDashboardWizard />
                        </WizardProvider>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default ImportDashboard;

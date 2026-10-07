import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { pushNotification } from '@redux/actions';
import useTabsNavigation, { useDashboardTabsNavigation } from '../hooks/useTabsNavigation';
import useDashboardTabsContext from '../../../hooks/useDashboardTabsContext';
import CreateDashboard from '../../CreateDashboard/index';
import { handleUpdateDashboardCategories } from '../../Dashboard/shared/utils/dashboardActions';

const DashboardTabs = ({ dashboard, currentDashboardId, mode = 'viewer' }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const user = useSelector((state) => state.user?.[0]);
  const userToken = user?.userID;

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // useDashboardTabsNavigation devuelve la lista correspondiente según el 'mode'
  const { tabs = [], isLoading } = useDashboardTabsNavigation(userToken, dashboard, mode);
  const { setDashboardTabs, selectDashboard } = useDashboardTabsContext();

  // Sync the tabs with the context whenever they change
  useEffect(() => {
    setDashboardTabs(tabs);
  }, [tabs, setDashboardTabs]);

  const tabState = tabs.map((tab) => ({
    name: String(tab.id),
    state: { isActive: String(tab.id) === String(currentDashboardId) }
  }));
  const { totalWidth } = useTabsNavigation(tabState, () => { });

  const handleDashboardCreated = (newDashboard) => {
    if (!newDashboard?.id) return;

    if (mode === 'editor') {
      sessionStorage.setItem('resourceId', newDashboard.id);
      sessionStorage.setItem('resourceName', newDashboard.name || '');
      sessionStorage.setItem('resourceType', newDashboard.type || 'dashboard');
      
      router.push(
        { pathname: '/dashboardsWorkspace', query: { id: newDashboard.id } },
        '/dashboardsWorkspace'
      );
    } else {
      router.push(`/dashboard/${newDashboard.id}`);
    }
  };

  const handleTabClick = (tab) => {
    const active = String(tab.id) === String(currentDashboardId);
    if (active) return;

    if (mode === 'editor') {
      sessionStorage.setItem('resourceId', tab.id);
      sessionStorage.setItem('resourceName', tab.name || '');
      sessionStorage.setItem('resourceType', tab.type || 'dashboard');
      router.push(
        { pathname: '/dashboardsWorkspace', query: { id: tab.id } },
        '/dashboardsWorkspace'
      );
      return;
    }

    router.push(`/dashboard/${tab.id}`);
  };

  // Determinar si el tablero actual tiene categorías asignadas
  const hasCategories = Array.isArray(dashboard?.categories) && dashboard.categories.length > 0;

  // Obtener los nombres de las categorías actuales para mostrarlos en el label final
  const categoryNamesText = useMemo(() => {
    if (!hasCategories) return '';
    return dashboard.categories.map((c) => c?.name).filter(Boolean).join(', ');
  }, [dashboard?.categories, hasCategories]);

  const handleRemoveCategory = async (tab, e) => {
    e.stopPropagation();
    if (!tab?.id || !userToken) return;
    try {
      const currentDashboardCategories = Array.isArray(dashboard?.categories) ? dashboard.categories : [];
      const currentCatIds = new Set(currentDashboardCategories.map(c => String(c.id || c.category_id || c)));
      const currentCatNames = new Set(currentDashboardCategories.map(c => String(c.name || '').toLowerCase().trim()));

      const tabCategories = Array.isArray(tab?.categories) ? tab.categories : [];
      const remainingCategories = tabCategories.filter(c => {
        const id = c.id || c.category_id;
        const name = c.name ? String(c.name).toLowerCase().trim() : '';
        return !((id && currentCatIds.has(String(id))) || (name && currentCatNames.has(name)));
      });

      const category_ids = remainingCategories.map(c => c.id || c.category_id).filter(Boolean);
      const category_names = remainingCategories.map(c => c.name).filter(Boolean);

      await handleUpdateDashboardCategories(tab.id, { category_ids, category_names }, userToken);

      // Invalidar consultas relacionadas para refrescar las vistas de forma inmediata
      await queryClient.invalidateQueries({ queryKey: ['dashboardViewerTabs'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardIndexGrouped'] });
      await queryClient.invalidateQueries({ queryKey: ['otherDashboards'] });

      dispatch(pushNotification({ msg: "Tablero desvinculado de la etiqueta correctamente.", status: "ok" }));
      router.replace(router.asPath);
    } catch (error) {
      console.error("Error removing category:", error);
      dispatch(pushNotification({ msg: error?.message || "No se pudo desvincular el tablero.", status: "err" }));
    }
  };

  if (isLoading || tabs.length < 1) return null;

  const handleOpenCreateModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCreateOpen(true);
  };

  return (
    <>
      <Box
        component="nav"
        aria-label="Tableros"
        sx={{
          position: 'relative',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 1,
          overflowX: 'auto',
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 -4px 18px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: Math.min(totalWidth, 900) }}>
          {tabs.map((tab) => {
            const active = String(tab.id) === String(currentDashboardId);
            return (
              <Button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                variant={active ? 'contained' : 'outlined'}
                sx={{
                  minWidth: 44,
                  maxWidth: 220,
                  flexShrink: 0,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1, textAlign: 'left' }}>
                  {tab.name}
                </span>
                {/* Solo se muestra el botón de eliminar si está en modo editor Y hay categorías activas */}
                {mode === 'editor' && hasCategories && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleRemoveCategory(tab, e)}
                    sx={{
                      p: 0.5,
                      color: 'inherit',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Button>
            );
          })}

          {/* El botón + se renderiza solo en modo editor */}
          {mode === 'editor' && (
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              variant="outlined"
              sx={{
                minWidth: 44,
                maxWidth: 220,
                flexShrink: 0,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              +
            </Button>
          )}

          {/* Label indicador de las categorías agrupadas actuales */}
          {categoryNamesText && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                px: 1.5,
                py: 0.75,
                typography: 'caption',
                color: 'text.secondary',
                bgcolor: 'action.hover',
                borderRadius: 1,
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              <span>Categoría/s: {categoryNamesText}</span>
            </Box>
          )}
        </Box>
      </Box>

      {mode === 'editor' && (
        <CreateDashboard
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          user={user}
          originDashboard={dashboard}
          onDashboardCreated={handleDashboardCreated}
        />
      )}

    </>
  );
};

export default DashboardTabs;



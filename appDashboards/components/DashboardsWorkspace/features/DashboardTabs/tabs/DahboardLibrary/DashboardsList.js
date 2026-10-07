import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { pushNotification } from '@redux/actions';
import useTabsNavigation, { useDashboardTabsNavigation } from '../hooks/useTabsNavigation';
import useDashboardTabsContext from '../../../hooks/useDashboardTabsContext';
import CreateDashboard from '../../CreateDashboard/index';
import { handleUpdateDashboardCategories } from '../../Dashboard/shared/utils/dashboardActions';

const DashboardTabs = ({ dashboard, currentDashboardId, mode = 'viewer' }) => {
  const router = useRouter();
  const dispatch = useDispatch();
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
      selectDashboard(newDashboard.id);
    } else {
      router.push(`/dashboard/${newDashboard.id}`);
    }
  };

  const handleRemoveCategory = async (tab, e) => {
    e.stopPropagation();
    if (!tab?.id || !userToken) return;
    try {
      const currentDashboardCategories = Array.isArray(dashboard?.categories) ? dashboard.categories : [];
      const currentCatIds = new Set(currentDashboardCategories.map(c => String(c.id || c.category_id)));
      const currentCatNames = new Set(currentDashboardCategories.map(c => String(c.name).toLowerCase().trim()));

      const tabCategories = Array.isArray(tab?.categories) ? tab.categories : [];
      const remainingCategories = tabCategories.filter(c => {
        const id = c.id || c.category_id;
        const name = c.name ? String(c.name).toLowerCase().trim() : '';
        return !((id && currentCatIds.has(String(id))) || (name && currentCatNames.has(name)));
      });

      const category_ids = remainingCategories.map(c => c.id || c.category_id).filter(Boolean);
      const category_names = remainingCategories.map(c => c.name).filter(Boolean);

      await handleUpdateDashboardCategories(tab.id, { category_ids, category_names }, userToken);
      dispatch(pushNotification({ msg: "Categoría removida del tablero correctamente.", status: "ok" }));
      router.replace(router.asPath);
    } catch (error) {
      console.error("Error removing category:", error);
      dispatch(pushNotification({ msg: error?.message || "No se pudo remover la categoría.", status: "err" }));
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
        <Box sx={{ display: 'flex', gap: 0.75, minWidth: Math.min(totalWidth, 900) }}>
          {tabs.map((tab) => {
            const active = String(tab.id) === String(currentDashboardId);
            return (
              <Button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (active) return;
                  if (mode === 'editor') {
                    selectDashboard(tab.id);
                    return;
                  }
                  router.push(`/dashboard/${tab.id}`);
                }}
                variant={active ? 'contained' : 'outlined'}
                sx={{
                  minWidth: active ? 180 : 44,
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
                {mode === 'editor' && (
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

          {/* The button + is only rendered in editor mode */}
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
        </Box>
      </Box>

      {mode === 'editor' && (
        <CreateDashboard
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          user={user}
          onDashboardCreated={handleDashboardCreated}
        />
      )}
    </>
  );
};

export default DashboardTabs;
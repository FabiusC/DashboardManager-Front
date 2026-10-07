import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  EditOutlined,
  DeleteOutline,
  SaveAsRounded,
} from '@mui/icons-material';
import { useDashboardTags } from './hooks/useDashboardTags';

const SectionHeader = ({ label, count, primary }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
    <Typography
      variant="caption"
      sx={{ fontWeight: 600, letterSpacing: 0.6, color: 'text.secondary', textTransform: 'uppercase', fontSize:"10px" }}
    >
      {label}
    </Typography>
    <Box
    
      sx={{
        minWidth: 22,
        height: 22,
        borderRadius: '50%',
        bgcolor: alpha(primary, 0.07),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 400,
        color: 'text.secondary',
      }}
    >
      {count}
    </Box>
  </Box>
);

const TagChip = ({ label, onDelete, sx }) => (
  <Typography
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.25,
      px: 0.75,
      py: 0.25,
      borderRadius: '12px',
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.2,
      ...sx,
    }}
  >
    {label}
    {onDelete && (
      <IconButton size="small" onClick={onDelete} sx={{ p: 0.15, color: 'inherit' }}>
        <CloseIcon sx={{ fontSize: 12 }} />
      </IconButton>
    )}
  </Typography>
);

const Categories = React.memo(({ dashboard, setDashboard, userToken }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const organization = useSelector((state) => state.organization?.[0]);
  const dangerColor =
    organization?.palette?.[2] ?? organization?.colors?.primaryColor ?? theme.palette.error.main;

  const {
    linked,
    search,
    setSearch,
    available,
    allCategories,
    isLoading,
    isSaving,
    isCreating,
    hasChanges,
    editingId,
    editName,
    setEditName,
    link,
    unlink,
    createFromSearch,
    createAndLinkFromSearch,
    save,
    startEdit,
    cancelEdit,
    confirmEdit,
    removeCategory,
    canDeleteCategoryTag,
    categoryDeleteBlockedMsg,
  } = useDashboardTags({ dashboard, setDashboard, userToken });

  const canAdd = search.trim().length > 0;
  const searchTerm = search.trim();
  const hasCatalogTags = allCategories.length > 0;
  const showSearchNotFound = Boolean(searchTerm && hasCatalogTags);

  const availableEmptyMessage = showSearchNotFound
    ? 'La etiqueta no existe.'
    : 'No hay etiquetas Disponibles.';

  const linkedChipSx = {
    bgcolor: alpha(primary, 0.12),
    border: `1px solid ${primary}`,
    color: primary,
  };

  const availableChipSx = {
    bgcolor: alpha(primary, 0.08),
    border: `1px solid ${alpha(primary, 0.35)}`,
    color: primary,
  };

  const compactFieldSx = {
    '& .MuiOutlinedInput-root': {
      height: 28,
      borderRadius: '12px',
      bgcolor: '#fff',
      fontSize: 12,
    },
    '& .MuiOutlinedInput-input': {
      fontSize: 12,
      py: 0,
      px: 1,
    },
  };

  const deleteButtonSx = {
    color: 'text.secondary',
    '&:hover': {
      color: dangerColor,
      backgroundColor: alpha(dangerColor, 0.12),
    },
  };

  return (
    <Box sx={{ width: '100%', height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          backgroundColor: '#ffffff',
          padding: 2,
          paddingTop: 0,
          overflowY: 'auto',
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5, pr: 1, fontSize:"12px" }}>
            Vincula etiquetas a este tablero
          </Typography>
          <Tooltip title="Guardar cambios" arrow placement="top">
            <span>
              <IconButton
                onClick={save}
                disabled={!hasChanges || isSaving}
                sx={{
                  '&:hover:not(.Mui-disabled)': {
                    color: theme.palette.primary.dark,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                  color: hasChanges ? theme.palette.primary.main : theme.palette.text.disabled,
                  borderRadius: '20px',
                  transition: 'all 0.3s ease-in-out',
                  padding: '4px',
                  margin: '4px',
                  '&.Mui-disabled': {
                    color: theme.palette.text.disabled,
                  },
                }}
              >
                {isSaving ? (
                  <CircularProgress size={20} />
                ) : (
                  <SaveAsRounded sx={{ fontSize: 20, color: 'inherit' }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <SectionHeader label="Vinculadas" count={linked.length} primary={primary} />
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(primary, 0.04),
            minHeight: 44,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            alignItems: 'center',
          }}
        >
          {linked.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
              No hay etiquetas vinculadas
            </Typography>
          ) : (
            linked.map((tag) => (
              <TagChip
                key={tag.id || tag.name}
                label={tag.name}
                onDelete={() => unlink(tag)}
                sx={linkedChipSx}
              />
            ))
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5, fontSize: 11 }}
          >
            Buscar o crear etiqueta
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'stretch' }}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createFromSearch();
              }}
              autoComplete="off"
              slotProps={{
                htmlInput: {
                  autoComplete: 'off',
                  name: 'dashboard-tag-search',
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  height: 32,
                  borderRadius: 2,
                  bgcolor: '#fff',
                  fontSize: 12,
                },
                '& input': {
                  fontSize: 12,
                  py: 0,
                },
              }}
            />
            <Tooltip title="Crear etiqueta" arrow placement="top">
              <span>
                <IconButton
                  onClick={createFromSearch}
                  disabled={!canAdd || isCreating}
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: '3px',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: alpha(primary, 0.3), color: '#fff' },
                  }}
                >
                  {isCreating ? <CircularProgress size={16} color="inherit" /> : <AddIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <SectionHeader label="Disponibles" count={available.length} primary={primary} />
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#fff',
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={22} />
            </Box>
          ) : available.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: showSearchNotFound ? 1 : 0 }}>
                {availableEmptyMessage}
              </Typography>
              {showSearchNotFound && (
                <Typography
                  component="button"
                  type="button"
                  onClick={createAndLinkFromSearch}
                  disabled={isCreating}
                  sx={{
                    fontSize: 12,
                    color: 'primary.main',
                    background: 'none',
                    border: 'none',
                    p: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Crear y vincular etiqueta
                </Typography>
              )}
            </Box>
          ) : (
            available.map((tag, index) => {
              const canDelete = canDeleteCategoryTag(tag);

              return (
              <Box
                key={tag.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: editingId === tag.id ? 0.75 : 1,
                  borderTop: index > 0 ? `1px solid ${theme.palette.divider}` : 'none',
                  '&:hover .tag-row-actions': { opacity: 1 },
                }}
              >
                {editingId === tag.id ? (
                  <TextField
                    size="small"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                    sx={{ flex: 1, mr: 1, maxWidth: 'calc(100% - 72px)', ...compactFieldSx }}
                  />
                ) : (
                  <TagChip label={tag.name} sx={availableChipSx} />
                )}

                <Box
                  className="tag-row-actions"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    opacity: editingId === tag.id ? 1 : 0.45,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {editingId === tag.id ? (
                    <>
                      <IconButton size="small" onClick={confirmEdit} color="primary">
                        <SaveAsRounded sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={cancelEdit}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <Tooltip title="Vincular" arrow>
                        <IconButton size="small" onClick={() => link(tag)} sx={{ color: 'text.secondary' }}>
                          <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar" arrow>
                        <IconButton size="small" onClick={() => startEdit(tag)} sx={{ color: 'text.secondary' }}>
                          <EditOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={canDelete ? 'Eliminar' : categoryDeleteBlockedMsg}
                        arrow
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => removeCategory(tag)}
                            disabled={!canDelete}
                            sx={{
                              ...deleteButtonSx,
                              ...(!canDelete && {
                                '&:hover': {
                                  color: 'text.disabled',
                                  backgroundColor: 'transparent',
                                },
                              }),
                            }}
                          >
                            <DeleteOutline sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </Box>
            );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
});

export default Categories;

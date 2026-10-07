import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import useDebounce from "hooks/useDebounce";
import {
  Box,
  Typography,
  TextField,
  Chip,
  IconButton,
  Stack,
  Popper,
  ClickAwayListener,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { createDashboardCategoriesMeta } from "../utils/formConfig";
import { handleListDashboardCategories } from "../../Dashboard/shared/utils/dashboardActions";

const CreateDashboardCategoriesField = ({ userToken, value = [], onChange }) => {
  const theme = useTheme();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["createDashboardCategories", debouncedSearch],
    queryFn: () => handleListDashboardCategories(userToken, debouncedSearch),
    enabled: !!userToken && open,
    placeholderData: (previousData) => previousData,
  });

  const options = useMemo(
    () =>
      searchResults
        .map((category) => ({ label: category.name, value: category.name }))
        .filter((option) => !value.includes(option.value)),
    [searchResults, value]
  );

  const trimmedDraft = draft.trim();
  const canAdd = trimmedDraft.length > 0 && !value.includes(trimmedDraft);
  const emptyMessage = trimmedDraft
    ? "Dale en agregar y la etiqueta se creará automáticamente."
    : "Escribe una etiqueta y pulsa agregar para crearla.";

  const closePanel = useCallback(() => setOpen(false), []);

  const handleClickAway = useCallback(
    (event) => {
      if (anchorRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      closePanel();
      setDraft("");
      setSearchQuery("");
    },
    [closePanel]
  );

  const handleAdd = useCallback(() => {
    if (!canAdd) return;
    onChange([...value, trimmedDraft]);
    closePanel();
    setDraft("");
    setSearchQuery("");
  }, [canAdd, trimmedDraft, value, onChange, closePanel]);

  const handleSelectOption = useCallback(
    (optionValue) => {
      if (value.includes(optionValue)) return;
      setDraft(optionValue);
      closePanel();
      setSearchQuery("");
      inputRef.current?.blur();
    },
    [value, closePanel]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {createDashboardCategoriesMeta.sectionIcon}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "15px" }}>
          {createDashboardCategoriesMeta.sectionTitle}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 3, ml: "10px", width: "100%" }}>
        <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary", pt: 1 }}>
          {createDashboardCategoriesMeta.fieldTitle}
        </Typography>

        <ClickAwayListener onClickAway={handleClickAway}>
          <Box sx={{ minWidth: 0 }}>
            {value.length > 0 && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {value.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    onDelete={() => onChange(value.filter((item) => item !== option))}
                    deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}

            <Box ref={anchorRef} sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
              <TextField
                fullWidth
                size="small"
                inputRef={inputRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setSearchQuery(event.target.value);
                  if (!open) setOpen(true);
                }}
                onFocus={() => {
                  setOpen(true);
                  setSearchQuery("");
                }}
                aria-label={createDashboardCategoriesMeta.fieldTitle}
                autoComplete="off"
              />
              <IconButton onClick={handleAdd} disabled={!canAdd} color="primary" size="small" aria-label="Agregar etiqueta">
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            <Popper
              open={open}
              anchorEl={anchorRef.current}
              placement="bottom-start"
              sx={{ zIndex: theme.zIndex.modal + 1, width: anchorRef.current?.offsetWidth }}
            >
              <Box ref={panelRef}>
                <Paper elevation={0} sx={{ mt: 0.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                  {isLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
                      <CircularProgress size={18} />
                    </Box>
                  ) : options.length > 0 ? (
                    <List dense disablePadding sx={{ maxHeight: 300, overflow: "auto" }}>
                      {options.map((option) => (
                        <ListItemButton
                          key={option.value}
                          selected={trimmedDraft === option.value}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectOption(option.value)}
                        >
                          <ListItemText primary={option.label} />
                        </ListItemButton>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 1.25, px: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {emptyMessage}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Popper>
          </Box>
        </ClickAwayListener>
      </Box>
    </Box>
  );
};

export default CreateDashboardCategoriesField;

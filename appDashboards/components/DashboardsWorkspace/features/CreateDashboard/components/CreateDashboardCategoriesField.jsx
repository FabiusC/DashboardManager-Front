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

const CreateDashboardCategoriesField = ({
  userToken,
  value = [],
  onChange,
  originDashboard,
}) => {
  const theme = useTheme();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  // Grant the value to be an array of strings
  const safeValue = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((v) => (typeof v === "object" ? v.name || v.value || "" : v))
        .filter(Boolean);
    }
    if (typeof value === "string") return [value];
    return [];
  }, [value]);

  // Verify if the origin dashboard has categories to avoid unnecessary API calls
  const hasOriginCategories = Boolean(
    Array.isArray(originDashboard?.categories) && originDashboard.categories.length > 0
  );

  // Query the API if there are no categories from the origin dashboard
  const { data: catalogCategories = [], isLoading } = useQuery({
    queryKey: ["createDashboardCategories", debouncedSearch],
    queryFn: () => handleListDashboardCategories(userToken, debouncedSearch),
    enabled: Boolean(userToken && open && !hasOriginCategories),
    placeholderData: (previousData) => previousData,
  });

  // Primary category source
  const rawCategoriesSource = hasOriginCategories
    ? originDashboard.categories
    : catalogCategories;

  // Options normalization
  const options = useMemo(() => {
    const list = Array.isArray(rawCategoriesSource)
      ? rawCategoriesSource
      : Array.isArray(rawCategoriesSource?.data)
      ? rawCategoriesSource.data
      : [];

    return list
      .map((cat) => {
        const label = typeof cat === "string" ? cat : cat?.name || cat?.label || cat?.value || "";
        return { label, value: label };
      })
      .filter((opt) => opt.value && !safeValue.includes(opt.value));
  }, [rawCategoriesSource, safeValue]);

  const trimmedDraft = draft.trim();
  const canAdd = trimmedDraft.length > 0 && !safeValue.includes(trimmedDraft);

  const emptyMessage = useMemo(() => {
    if (originDashboard && !hasOriginCategories) {
      return "El tablero origen no tiene categorías asignadas.";
    }
    return trimmedDraft
      ? "Dale en agregar y la etiqueta se creará automáticamente."
      : "Escribe una etiqueta y pulsa agregar para crearla.";
  }, [originDashboard, hasOriginCategories, trimmedDraft]);

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

  const emitChange = useCallback(
    (nextValue) => {
      if (onChange) {
        onChange(nextValue);
      }
    },
    [onChange]
  );

  const handleAdd = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!canAdd) return;

      const next = [...safeValue, trimmedDraft];
      emitChange(next);
      closePanel();
      setDraft("");
      setSearchQuery("");
    },
    [canAdd, trimmedDraft, safeValue, emitChange, closePanel]
  );

  const handleSelectOption = useCallback(
    (optionValue) => {
      if (safeValue.includes(optionValue)) return;
      const next = [...safeValue, optionValue];
      emitChange(next);
      closePanel();
      setDraft("");
      setSearchQuery("");
      inputRef.current?.blur();
    },
    [safeValue, emitChange, closePanel]
  );

  const handleDelete = useCallback(
    (itemToDelete) => {
      const next = safeValue.filter((item) => item !== itemToDelete);
      emitChange(next);
    },
    [safeValue, emitChange]
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
            {safeValue.length > 0 && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {safeValue.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    onDelete={() => handleDelete(option)}
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
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    handleAdd(event);
                  }
                }}
                aria-label={createDashboardCategoriesMeta.fieldTitle}
                autoComplete="off"
              />
              <IconButton
                type="button"
                onClick={handleAdd}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!canAdd}
                color="primary"
                size="small"
                aria-label="Agregar etiqueta"
              >
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

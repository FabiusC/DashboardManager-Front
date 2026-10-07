import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useDebounce from "hooks/useDebounce";
import {
  Box,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Check, Close, KeyboardArrowDown, LocalOffer, Search } from "@mui/icons-material";
import { handleListDashboardCategories } from "../../shared/utils/dashboardActions";
import {
  DASHBOARD_INDEX_UNCATEGORIZED_ID,
  DASHBOARD_INDEX_UNCATEGORIZED_LABEL,
} from "../services/dashboardIndexService";

const ALL_TAGS_LABEL = "Todas las etiquetas";

const TagOptionRow = ({ label, count, selected, accentColor, onClick }) => (
  <ListItemButton
    selected={selected}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    sx={{
      px: 2,
      py: 0.875,
      "&.Mui-selected, &.Mui-selected:hover": {
        bgcolor: alpha(accentColor, 0.08),
      },
    }}
  >
    <ListItemText
      primary={label}
      slotProps={{
        primary: {
          fontSize: "0.8125rem",
          fontWeight: selected ? 600 : 400,
          color: selected ? accentColor : "text.primary",
          noWrap: true,
        },
      }}
    />
    {selected ? (
      <Check sx={{ fontSize: "1.125rem", color: accentColor, ml: 1 }} />
    ) : (
      count != null && (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 500, ml: 1 }}
        >
          {count}
        </Typography>
      )
    )}
  </ListItemButton>
);

const DashboardIndexTagFilter = ({
  userToken,
  panelOpen,
  categories = [],
  selectedTag,
  onSelectTag,
}) => {
  const theme = useTheme();
  const accentColor = theme.palette.primary.main;

  const anchorRef = useRef(null);
  const panelRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const searchTerm = debouncedSearch.trim();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["dashboardIndexTags", userToken, searchTerm],
    queryFn: () => handleListDashboardCategories(userToken, searchTerm),
    enabled: panelOpen && open && !!userToken,
    placeholderData: (previousData) => previousData,
  });

  const countById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => map.set(String(category.id), category.dashboardCount));
    return map;
  }, [categories]);

  const options = useMemo(() => {
    if (searchTerm) return tags;
    return [
      ...tags,
      { id: DASHBOARD_INDEX_UNCATEGORIZED_ID, name: DASHBOARD_INDEX_UNCATEGORIZED_LABEL },
    ];
  }, [searchTerm, tags]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  const handleClickAway = useCallback(
    (event) => {
      if (anchorRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      closeDropdown();
    },
    [closeDropdown],
  );

  const handleSelect = useCallback(
    (tag) => {
      onSelectTag(tag);
      closeDropdown();
    },
    [closeDropdown, onSelectTag],
  );

  const handleClear = useCallback(() => {
    onSelectTag(null);
    closeDropdown();
  }, [closeDropdown, onSelectTag]);

  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);

  const triggerLabel = selectedTag?.name ?? ALL_TAGS_LABEL;

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box ref={anchorRef}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 0.75,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "text.secondary",
            fontSize: "0.6875rem",
          }}
        >
          FILTRAR POR ETIQUETA
        </Typography>

        <Box
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggleOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleOpen();
            }
          }}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            maxWidth: "100%",
            px: 1.5,
            py: 0.5,
            border: "1px solid #E2E8F0",
            borderRadius: "999px",
            bgcolor: "#fff",
            cursor: "pointer",
            transition: "border-color 160ms ease, background-color 160ms ease",
            "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: accentColor,
              outlineOffset: 1,
            },
          }}
        >
          <LocalOffer sx={{ fontSize: "1rem", color: accentColor, flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {triggerLabel}
          </Typography>

          {selectedTag ? (
            <IconButton
              size="small"
              aria-label="Limpiar etiqueta"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                handleClear();
              }}
              sx={{ p: 0.25, flexShrink: 0 }}
            >
              <Close sx={{ fontSize: "1.125rem", color: accentColor }} />
            </IconButton>
          ) : (
            <KeyboardArrowDown
              sx={{
                fontSize: "1.125rem",
                color: "text.secondary",
                flexShrink: 0,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 160ms ease",
              }}
            />
          )}
        </Box>

        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          style={{ zIndex: theme.zIndex.modal + 1 }}
        >
          <Box ref={panelRef}>
            <Paper
              elevation={0}
              sx={{
                mt: 0.75,
                width: 300,
                maxWidth: "calc(100vw - 48px)",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 1.5, pb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  autoFocus
                  placeholder="Buscar etiqueta..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  autoComplete="off"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: "1.125rem", color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      fontSize: "0.8125rem",
                      "& fieldset": { borderColor: "#E2E8F0" },
                    },
                  }}
                />
              </Box>

              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <List dense disablePadding sx={{ maxHeight: 280, overflowY: "auto", pb: 0.5 }}>
                  {!searchTerm && (
                    <TagOptionRow
                      label={ALL_TAGS_LABEL}
                      selected={!selectedTag}
                      accentColor={accentColor}
                      onClick={() => handleSelect(null)}
                    />
                  )}

                  {options.length > 0 ? (
                    options.map((tag) => (
                      <TagOptionRow
                        key={tag.id ?? tag.name}
                        label={tag.name}
                        count={countById.get(String(tag.id))}
                        selected={String(selectedTag?.id) === String(tag.id)}
                        accentColor={accentColor}
                        onClick={() => handleSelect(tag)}
                      />
                    ))
                  ) : (
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.8125rem" }}
                      >
                        No se encontraron etiquetas.
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </Paper>
          </Box>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default DashboardIndexTagFilter;

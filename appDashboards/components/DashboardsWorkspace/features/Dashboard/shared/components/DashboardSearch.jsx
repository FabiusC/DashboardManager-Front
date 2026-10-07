import { Box, TextField, InputAdornment, IconButton, useTheme } from "@mui/material";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Close, Search } from "@mui/icons-material";
import { setSearch } from "@redux/actions";

export const DashboardSearch = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const appliedSearch = useSelector((state) => state.filters?.search ?? "");
    const [inputValue, setInputValue] = useState(appliedSearch);
    const lastAppliedSearchRef = useRef(appliedSearch);

    // Update Redux state when debounced value changes
    useEffect(() => {
        if (appliedSearch !== lastAppliedSearchRef.current) {
            lastAppliedSearchRef.current = appliedSearch;
            setInputValue(appliedSearch);
        }
    }, [appliedSearch]);

    const hasAppliedSearch = appliedSearch !== "";

    const submitSearch = useCallback(() => {
        if (inputValue === lastAppliedSearchRef.current) {
            return;
        }

        lastAppliedSearchRef.current = inputValue;
        dispatch(setSearch(inputValue));
    }, [inputValue, dispatch]);

    const clearSearch = useCallback(() => {
        if (lastAppliedSearchRef.current === "" && inputValue === "") {
            return;
        }

        lastAppliedSearchRef.current = "";
        setInputValue("");
        dispatch(setSearch(""));
    }, [inputValue, dispatch]);

    const handleSubmit = (event) => {
        event.preventDefault();
        submitSearch();
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                transition: "transform 220ms ease, filter 220ms ease",
                transformOrigin: "right center",
                "&:focus-within": {
                    transform: { xs: "none", lg: "scaleX(1.03)" },
                },
            }}
        >
            <TextField
                type="text"
                variant="outlined"
                size="small"
                placeholder="Buscar en el tablero..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                autoComplete="off"
                sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                        height: 36,
                        borderRadius: 999,
                        backgroundColor: theme.palette.action.hover,
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.10)",
                        transition:
                            "box-shadow 220ms ease, background-color 220ms ease, transform 220ms ease",
                        "& fieldset": { borderColor: theme.palette.divider },
                        "&:hover fieldset": { borderColor: theme.palette.divider },
                        "&.Mui-focused fieldset": { borderWidth: "1px" },
                    },
                    "& .MuiInputBase-input": {
                        py: 0.75,
                        pl: 1.75,
                        pr: 0.5,
                        fontSize: "0.875rem",
                    },
                    "& .MuiInputAdornment-root": { mr: 0.25 },
                }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                type={hasAppliedSearch ? "button" : "submit"}
                                size="small"
                                aria-label={hasAppliedSearch ? "Limpiar búsqueda" : "Buscar en el tablero"}
                                edge="end"
                                onClick={hasAppliedSearch ? clearSearch : undefined}
                                onMouseDown={(event) => event.preventDefault()}
                                sx={{
                                    color: "text.secondary",
                                    transition: "color 220ms ease",
                                    ".Mui-focused &": {
                                        color: theme.palette.primary.main,
                                    },
                                }}
                            >
                                {hasAppliedSearch ? (
                                    <Close sx={{ fontSize: "1.1rem" }} />
                                ) : (
                                    <Search sx={{ fontSize: "1.1rem" }} />
                                )}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
        </Box>
    );
};
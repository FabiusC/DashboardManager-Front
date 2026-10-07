import { useEffect, useMemo, useState } from 'react';
import { alpha, Box, Slider, TextField, Typography, useTheme } from '@mui/material';
import { debounce } from 'lodash';

const RangeInput = ({ keyName, type, value_type, type_es, value, id, handleInputChange, content_options, idComponent, parentData, isFloat = false }) => {
    const theme = useTheme();
    const [localValue, setLocalValue] = useState(isFloat ? parseFloat(value) || 0 : parseInt(value) || 0);

    useEffect(() => {
        setLocalValue(isFloat ? parseFloat(value) || 0 : parseInt(value) || 0);
    }, [value, isFloat]);

    const debouncedUpdate = useMemo(() => debounce((newValue) => {
        handleInputChange(keyName, type, id, newValue, value_type, idComponent, parentData); // Pass parentData
    }, 200), []);

    const onValueChange = (newValue) => {
        setLocalValue(newValue);
        debouncedUpdate(newValue);
    };

    const lower = parseFloat(content_options?.find(opt => opt.type === "limit_lower")?.value ?? "0");
    const upper = parseFloat(content_options?.find(opt => opt.type === "limit_upper")?.value ?? "100");
    const step = parseFloat(content_options?.find(opt => opt.type === "step")?.value ?? "1");

    return (
        <Box key={keyName}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>{type_es}</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1, mr: 2 }}>
                    <Slider
                        value={localValue}
                        onChange={(_, newVal) => onValueChange(newVal)}
                        min={lower}
                        max={upper}
                        step={step}
                        valueLabelDisplay="auto"
                        sx={{
                            "& .MuiSlider-thumb": {
                                width: 12,
                                height: 12,
                                "&:hover": {
                                boxShadow: `0px 0px 0px 2px ${alpha(theme.palette.primary.main, 0.16)}`,
                                },
                                "&.Mui-focusVisible": {
                                boxShadow: `0px 0px 0px 2px ${alpha(theme.palette.primary.main, 0.16)}`,
                                },
                                "&.Mui-active": {
                                boxShadow: `0px 0px 0px 4px ${alpha(theme.palette.primary.main, 0.16)}`,
                                },
                            },
                            // Personalizar el track (línea)
                            "& .MuiSlider-track": {
                                height: 2,
                            },
                            // Personalizar el rail (línea de fondo)
                            "& .MuiSlider-rail": {
                                height: 2,
                            },
                        }}
                    />
                </Box>
                <TextField
                    value={localValue}
                    onChange={(e) => {
                        const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                        if (!isNaN(val)) onValueChange(val);
                    }}
                    size="small"
                    type="number"
                    InputProps={{ 
                        inputProps: { 
                            min: lower, 
                            max: upper, 
                            step: isFloat ? step : 1
                        } 
                    }}
                    sx={{ width: 70 }}
                />
            </Box>
        </Box>
    );
};

export default RangeInput;
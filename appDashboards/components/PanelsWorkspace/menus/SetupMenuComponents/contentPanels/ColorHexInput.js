import { useEffect, useMemo, useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { debounce } from 'lodash';

const ColorHexInput = ({ keyName, type, value_type, type_es, value, id, handleInputChange, idComponent, parentData }) => {
    const [color, setColor] = useState(value);

    useEffect(() => {
        setColor(value);
    }, [value]);

    const debouncedUpdate = useMemo(() => debounce((newColor) => {
        handleInputChange(keyName, type, id, newColor, value_type, idComponent, parentData); // Pass parentData
    }, 200), []);

    const onColorChange = (newVal) => {
        setColor(newVal);
        debouncedUpdate(newVal);
    };

    return (
        <Box key={keyName}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>{type_es}</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{ width: '15%', height: '40px' }}
                />
                <TextField
                    label="Color (Hex)"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    placeholder="#000000"
                    size='small'
                    InputLabelProps={{
                        shrink: true
                    }}
                    sx={{ width: '85%' }}
                />
            </Box>
        </Box>
    )
}

export default ColorHexInput;
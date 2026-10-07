import React from 'react';
import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function ImportPathSearchField({
    value,
    onChange,
    placeholder = 'Buscar…',
    disabled = false
}) {
    return (
        <TextField
            type="search"
            size="small"
            fullWidth
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </InputAdornment>
                    )}
            }}
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#FFFFFF',
                    fontSize: '0.8125rem',
                    '& fieldset': { borderColor: '#E2E5EB' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1 }
                },
                '& .MuiInputBase-input': {
                    py: 0.85,
                    px: 0.5
                }
            }}
        />
    );
}

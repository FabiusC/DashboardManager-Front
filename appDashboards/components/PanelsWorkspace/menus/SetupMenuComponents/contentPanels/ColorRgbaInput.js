import { useEffect, useRef, useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import iro from '@jaames/iro';
import { debounce } from 'lodash';

const ColorRgbaInput = ({ keyName, type, value_type, type_es, value, id, handleInputChange, idComponent, parentData }) => {
    const alphaSliderRef = useRef(null);
    const iroRef = useRef(null);
    const ignoreIroChangeRef = useRef(false);

    const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
    const [alpha, setAlpha] = useState(1);
    const [rgbaInput, setRgbaInput] = useState('rgba(0, 0, 0, 1)');

    const toRgbaString = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;

    useEffect(() => {
        if (value?.startsWith('rgba')) {
        const match = value.match(/rgba\((\d+), ?(\d+), ?(\d+), ?([\d.]+)\)/);
        if (match) {
            const newRgb = { r: +match[1], g: +match[2], b: +match[3] };
            const newAlpha = parseFloat(match[4]);
            setRgb(newRgb);
            setAlpha(newAlpha);
            setRgbaInput(toRgbaString(newRgb.r, newRgb.g, newRgb.b, newAlpha));
        }
        } else if (value?.startsWith('#')) {
        const hex = value.replace('#', '');
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            setRgb({ r, g, b });
            setAlpha(1);
            setRgbaInput(toRgbaString(r, g, b, 1));
        }
        }
    }, [value]);

    const suppressIroChangeRef = useRef(false);
    const ignoreEffectRef = useRef(false);

    useEffect(() => {
        if (alphaSliderRef.current && !iroRef.current) {
            iroRef.current = new iro.ColorPicker(alphaSliderRef.current, {
                width: 120,
                layout: [
                    {
                        component: iro.ui.Slider,
                        options: { sliderType: 'alpha' },
                    },
                ],
                color: toRgbaString(rgb.r, rgb.g, rgb.b, alpha),
            });

            iroRef.current.on('color:change', (color) => {
                if (suppressIroChangeRef.current) return;

                const newAlpha = parseFloat(color.alpha.toFixed(2));
                const rgb = color.rgb;
                const newRgba = toRgbaString(rgb.r, rgb.g, rgb.b, newAlpha);
                if (newAlpha !== alpha) {
                    ignoreEffectRef.current = true;
                    setAlpha(newAlpha);
                    setRgbaInput(newRgba);
                    handleInputChange(keyName, type, id, newRgba, value_type, idComponent, parentData);
                }
            });
        }

        if (ignoreEffectRef.current) {
            ignoreEffectRef.current = false;
            return;
        }

        if (iroRef.current) {
            const current = iroRef.current.color;
            const sameColor =
                current.r === rgb.r &&
                current.g === rgb.g &&
                current.b === rgb.b &&
                parseFloat(current.alpha.toFixed(2)) === parseFloat(alpha.toFixed(2));

            if (!sameColor) {
                suppressIroChangeRef.current = true;
                iroRef.current.color.set(toRgbaString(rgb.r, rgb.g, rgb.b, alpha));
                setTimeout(() => {
                    suppressIroChangeRef.current = false;
                }, 0);
            }
        }
    }, [rgb, alpha]);

    const handleColorChange = (e) => {
        const hex = e.target.value;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const newRgba = toRgbaString(r, g, b, alpha);
        setRgb({ r, g, b });
        setRgbaInput(newRgba);
        handleInputChange(keyName, type, id, newRgba, value_type, idComponent, parentData);
    };

    const handleRgbaInputChange = (e) => {
        const input = e.target.value;
        setRgbaInput(input);
        const match = input.match(/rgba\((\d+), ?(\d+), ?(\d+), ?([\d.]+)\)/);
        if (match) {
        const newRgb = { r: +match[1], g: +match[2], b: +match[3] };
        const newAlpha = parseFloat(match[4]);
        setRgb(newRgb);
        setAlpha(newAlpha);
        handleInputChange(keyName, type, id, input, value_type, idComponent, parentData);
        }
    };

    const hexFromRgb = (r, g, b) =>
        `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>{type_es}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ width: '100%', display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                    type="color"
                    value={hexFromRgb(rgb.r, rgb.g, rgb.b)}
                    onChange={handleColorChange}
                    style={{ width: '30%', height: '40px', border: 'none', cursor: 'pointer' }}
                />
                <Box ref={alphaSliderRef} sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }} />
            </Box>

            <TextField
                fullWidth
                value={rgbaInput}
                onChange={handleRgbaInputChange}
                label="Valor RGBA"
                InputLabelProps={{
                    shrink: true
                }}
                size="small"
            />
        </Box>
        </Box>
    );
};

export default ColorRgbaInput;
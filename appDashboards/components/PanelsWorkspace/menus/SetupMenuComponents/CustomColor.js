import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import { IroColorPicker } from '@jaames/iro';
// import 'iro.js/dist/iro.min.css';

const CustomColor = ({ initialColors = [], onChange }) => {
    const [customColors, setCustomColors] = useState(initialColors);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedColor, setSelectedColor] = useState('#000000');
  
    useEffect(() => {
      onChange?.(customColors);
    }, [customColors]);
  
    const handleAddColor = () => {
      const defaultColor = '#000000';
      const updated = [...customColors, defaultColor];
      setCustomColors(updated);
      setSelectedIndex(updated.length - 1);
      setSelectedColor(defaultColor);
    };
  
    const handleSelectColor = (index) => {
      setSelectedIndex(index);
      setSelectedColor(customColors[index]);
    };
  
    const handleColorChange = (newColor) => {
      setSelectedColor(newColor);
      if (selectedIndex !== null) {
        const updated = [...customColors];
        updated[selectedIndex] = newColor;
        setCustomColors(updated);
      }
    };
  
    const handleRemoveColor = (indexToRemove) => {
      const updated = customColors.filter((_, i) => i !== indexToRemove);
      setCustomColors(updated);
      if (selectedIndex === indexToRemove) {
        setSelectedIndex(null);
      } else if (selectedIndex > indexToRemove) {
        setSelectedIndex((prev) => prev - 1);
      }
    };
  
    return (
      <Box p={3}>
        <Button variant="contained" onClick={handleAddColor}>
          Agregar color
        </Button>
  
        <Box mt={3} display="flex" gap={2} flexWrap="wrap">
          {customColors.map((color, index) => (
            <Box
              key={index}
              onClick={() => handleSelectColor(index)}
              sx={{
                width: 100,
                height: 100,
                backgroundColor: color,
                border: selectedIndex === index ? '3px solid #1976d2' : '1px solid #ccc',
                position: 'relative',
                borderRadius: 2,
                cursor: 'pointer',
                transition: '0.2s',
              }}
            >
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveColor(index);
                }}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: '#fff',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  textAlign: 'center',
                  fontSize: 14,
                  lineHeight: '20px',
                  color: '#f00',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                ×
              </Box>
            </Box>
          ))}
        </Box>
  
        {/* {selectedIndex !== null && (
          <Box mt={4}>
            <IroColorPicker
              color={selectedColor}
              onColorChange={(color) => handleColorChange(color.hexString)}
              layout={[
                { component: iro.ui.Box },
                { component: iro.ui.Slider, options: { sliderType: 'hue' } },
                { component: iro.ui.Slider, options: { sliderType: 'alpha' } }
              ]}
              width={280}
            />
          </Box>
        )} */}
      </Box>
    );
  };
  
    

export default CustomColor

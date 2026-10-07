import React, { useRef, useState, useEffect, use } from "react";
import tinycolor from "tinycolor2";
import { Box, Grid, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, IconButton } from "@mui/material";
import iro from "@jaames/iro";
import { Add } from "@mui/icons-material";
import CustomColor from "./CustomColor";

export const ColorConfig = () => {
  const [palettes, setPalettes] = useState([]);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedPalette, setSelectedPalette] = useState("Monochromatic");
  const [selectedPaletteColors, setSelectedPaletteColors] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("chartColors")
  const [colorFormats, setColorFormats] = useState({});
  const [customColor, setCustomColor] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const colorPickerRef = useRef(null);
  const pickerInstance = useRef(null);

  const properties = [
    { value: "chartColors", label: "Color de gráfica" },
    // { value: "panelBackground", label: "Fondo del panel" },
    // { value: "canvasBackground", label: "Fondo del lienzo" },
    // { value: "titleColor", label: "Color del título" },
    // { value: "chartTextColor", label: "Texto de la gráfica" },
    // { value: "borderColor", label: "Borde del panel" },
  ]

  useEffect(() => {
    if (colorPickerRef.current && !pickerInstance.current) {
      pickerInstance.current = new iro.ColorPicker(colorPickerRef.current, {
        width: 290,
        color: selectedColor,
      });

      pickerInstance.current.on("color:change", (color) => {
        setSelectedColor(color.hexString);
        if (selectedPalette === "Personalized") {
          setCustomColor((prev) => {
            const updated = [...prev];
            updated[editingIndex] = color.hexString;
            return updated;
          })
        }
        
      });
    }
  }, []);

  useEffect(() => {
    handlePaletteChange(selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    if(selectedPalette === "Personalized"){
      const palettePersonalized = []
      palettePersonalized.push(selectedColor)
      setSelectedPaletteColors(palettePersonalized);
    }
  }, [selectedColor]);

  useEffect(() => {
    if(selectedPalette === "Personalized"){
      setSelectedPaletteColors(customColor);
    }
  }, [customColor]);

  const handleColorCodes = (color) => {
    const hex = tinycolor(color).toHexString();
    const rgb = tinycolor(color).toRgbString();
    const hsl = tinycolor(color).toHslString();
    return { hex, rgb, hsl };
  }

  const handleFormatChange = (index, newFormat) => {
    setColorFormats((prev) => ({
      ...prev,
      [index]: newFormat,
    }));
  };

  const handlePaletteSelection = (paletteName) => {
    const palette = palettes.find((p) => p.name === paletteName);
    if (palette) {
      setSelectedPalette(palette.name);
      setSelectedPaletteColors(palette.colors);
    }
  }

  const handlePaletteChange = (color) => {
    const monochromatic = tinycolor(color).monochromatic();
    const triadic = tinycolor(color).triad();
    const analogous = tinycolor(color).analogous().slice(0, 3);
    const tetradic = tinycolor(color).tetrad();
    const complementary = tinycolor(color).complement().toHexString();
    const splitComplementary = tinycolor(color).splitcomplement();
    const personalized = customColor.map(c => c);
    const newPalettes = [
      { name: "Monochromatic", alias: "Monocromático", colors: monochromatic.map(c => c.toHexString()) },
      { name: "Triadic", alias: "Tríada", colors: triadic.map(c => c.toHexString()) },
      { name: "Analogous", alias: "Análogo", colors: analogous.map(c => c.toHexString()) },
      { name: "Tetradic", alias: "Tetrada", colors: tetradic.map(c => c.toHexString()) },
      { name: "Complementary", alias: "Complementario", colors: [].concat(color, complementary) },
      { name: "Split Complementary", alias: "Complementario dividido", colors: splitComplementary.map(c => c.toHexString()) },
      // { name: "Personalized", alias: "Personalizado", colors: customColor },
    ];
    setPalettes(newPalettes);
    const current = newPalettes.find(p => p.name === selectedPalette) || newPalettes[0];
    setSelectedPalette(current.name);
    setSelectedPaletteColors(current.colors);
  }

  // const handleAddColor = () => {
  //   setCustomColor((prevColors) => {
  //     const newColors = prevColors.includes(selectedColor) ? prevColors : [...prevColors, selectedColor];
  //     setEditingIndex(newColors.length - 1);
  //     return newColors;
  //   });
  // } 

  const handleAddColor = () => {
    const defaultColor = "#000000";

    setCustomColor((prev) => {
      const updated = [...prev, defaultColor];
      setSelectedPaletteColors(updated);
      return updated;
    });
  };

  const handleRemoveColor = (index) => {
    setCustomColor((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setSelectedPaletteColors(updated);
      return updated;
    });
  };

  // const handleResetColors = () => {
  //   setCustomColor(["#ffffff"]);
  // }

  const handleEditColor = (index) => {
    setEditingIndex(index);
    const color = customColor[index];
    setSelectedColor(color);

  };

  return (
    <div className="p-4">
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Selección de propiedad
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Propiedad a modificar</InputLabel>
              <Select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                label="Propiedad a modificar"
              >
                {properties.map((prop) => (
                  <MenuItem key={prop.value} value={prop.value}>
                    {prop.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedProperty === "chartColors" && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Selección de paleta
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Paleta de colores</InputLabel>
                <Select
                  value={selectedPalette}
                  onChange={(e) => handlePaletteSelection(e.target.value)}
                  label="Paleta de colores"
                >
                  {palettes.map((palette) => (
                    <MenuItem key={palette.name} value={palette.name}>
                      {palette.alias}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
      <Box sx={{ display: "flex", mb: 2, height: '400px' }}>
        <Box sx={{ mr: 3, mb: 2, ml: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
          <div
            className="w-10 h-10 border rounded cursor-pointer mr-4"
            style={{ backgroundColor: selectedColor }}
          />
          <div ref={colorPickerRef} />
          <Grid container sx={{ width: '80%', height: '50px', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', borderRadius: 1, overflow: 'hidden', mt: 2 }}>
            {selectedPaletteColors.map((color, index) => (
              <div
                key={index}
                style={{ width: '100%', height: '100%', backgroundColor: color }}
              />
            ))}
          </Grid>
        </Box>
        <Box sx={{ pl: '12%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap', alignContent: 'flex-start' }}>
          {selectedProperty === "chartColors" && selectedPalette  ? (
            selectedPaletteColors.map((color, index) => {
              const format = colorFormats[index] || "hex";
              const codes = handleColorCodes(color);
              return (
                <>
                {/* {selectedPalette === "Personalized" && (  
                  // <Box
                  //   key={index}
                  //   onClick={() => {
                  //     setEditingIndex(index);
                  //     setSelectedColor(color);
                  //     setCustomColor((prev) => {
                  //       const updated = [...prev];
                  //       updated[index] = color;
                  //       return updated;
                  //     }
                  //     );
                  //     handleUpdateColor(index, color);
                  //   }}
                  //   onMouseEnter={() => setEditingIndex(index)}
                  //   onMouseLeave={() => setEditingIndex(null)}  
                  //   sx={{
                  //     height: '80px',
                  //     width: '120px', 
                  //     border: '1px solid #ccc',
                  //     display: 'flex',
                  //     flexDirection: 'column',
                  //     alignItems: 'center',
                  //     justifyContent: 'flex-end',
                  //     backgroundColor: color,
                  //     padding: 1,
                  //     boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  //     color: tinycolor(color).isLight() ? '#000' : '#fff',
                  //     cursor: "pointer", 
                  //     position: "relative",
                  //   }}
                  // >
                  //   {customColor.length < 12 && index === selectedPaletteColors.length - 1 && (
                  //     <Tooltip title="Agregar color">
                  //       <IconButton
                  //         size="small"
                  //         sx={{ 
                  //           position: 'absolute', 
                  //           top: 5, 
                  //           right: 5, 
                  //           backgroundColor: "#eee", 
                  //           border: "1px dashed #999" 
                  //         }}
                  //         onClick={handleAddColor}
                  //       >
                  //         <Add fontSize="small" />
                  //       </IconButton>
                  //     </Tooltip>
                  //   )}
                  //   {index !== 0 && editingIndex === index && (
                  //     <Box
                  //       onClick={() => {
                  //         handleRemoveColor(index);
                  //       }}
                  //       sx={{
                  //         width: 20,
                  //         height: 20,
                  //         backgroundColor: "#eee",
                  //         border: "1px dashed #999",
                  //         borderRadius: 6,
                  //         display: "flex",
                  //         alignItems: "center",
                  //         justifyContent: "center",
                  //         cursor: "pointer",
                  //         fontSize: 24,
                  //         color: "#666", 
                  //         position: "absolute",
                  //         top: 5,
                  //         left: 5,
                  //       }}
                  //     >
                  //       -
                  //     </Box>
                  //   )}
                  //   <FormControl variant="outlined" size="small" 
                  //     sx={{ 
                  //       backgroundColor: '#ffffffe0', 
                  //       borderRadius: 1, 
                  //       '& .MuiSelect-select': {
                  //         padding: '8px 32px 8px 10px !important',
                  //         display: 'flex',
                  //         alignItems: 'center',
                  //         justifyContent: 'space-between',
                  //         whiteSpace: 'break-spaces', 
                  //         fontSize: '14px',
                  //       },
                  //     }}
                  //   >
                  //     <Select
                  //       value={format}
                  //       onChange={(e) => handleFormatChange(index, e.target.value)}
                  //       renderValue={(value) => codes[value] || "N/A"}
                  //       displayEmpty
                  //     >
                  //       <MenuItem value="hex">HEX</MenuItem>
                  //       <MenuItem value="rgb">RGB</MenuItem>
                  //       <MenuItem value="hsl">HSL</MenuItem>
                  //     </Select>
                  //   </FormControl>
                  // </Box>
                  <CustomColor
                    key={index}
                    index={index}
                    color={color}
                    editingIndex={editingIndex}
                    onEdit={() => handleEditColor(index)}
                    onRemove={() => handleRemoveColor(index)}
                    onAdd={handleAddColor}
                    format={colorFormats[index] || 'hex'}
                    onFormatChange={(value) => handleFormatChange(index, value)}
                    codes={handleColorCodes(color)}
                    isLast={index === selectedPaletteColors.length - 1}
                    totalColors={customColor.length}
                  />
                )} */}
                {selectedPalette !== "Personalized" && (  
                  <Box
                    key={index}
                    sx={{
                      height: '80px',
                      width: '120px',
                      border: '1px solid #ccc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      backgroundColor: color,
                      padding: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      color: tinycolor(color).isLight() ? '#000' : '#fff',
                    }}
                  >
                    <FormControl variant="outlined" size="small" 
                      sx={{ 
                        backgroundColor: '#ffffffe0', 
                        borderRadius: 1, 
                        '& .MuiSelect-select': {
                          padding: '8px 32px 8px 10px !important',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          whiteSpace: 'break-spaces', 
                          fontSize: '14px',
                        },
                      }}
                    >
                      <Select
                        value={format}
                        onChange={(e) => handleFormatChange(index, e.target.value)}
                        renderValue={(value) => codes[value] || "N/A"}
                        displayEmpty
                      >
                        <MenuItem value="hex">HEX</MenuItem>
                        <MenuItem value="rgb">RGB</MenuItem>
                        <MenuItem value="hsl">HSL</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
                </>
              );
            })
          ) : (
            <Box
              sx={{
                height: '80px',
                width: '120px',
                border: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                backgroundColor: "#ff5733",
                padding: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                color: tinycolor("#ff5733").isLight() ? '#000' : '#fff',
              }}
            >
              <FormControl variant="outlined" size="small" 
                sx={{ 
                  backgroundColor: '#ffffffe0', 
                  borderRadius: 1, 
                  '& .MuiSelect-select': {
                    padding: '8px 32px 8px 10px !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    whiteSpace: 'break-spaces', 
                    fontSize: '14px',
                  },
                }}
              >
                <Select
                  value={colorFormats[0] || "hex"}
                  onChange={(e) => handleFormatChange(0, e.target.value)}
                  renderValue={(value) => {
                    const codes = handleColorCodes("#ff5733");
                    return codes[value] || "N/A"
                  }}
                  displayEmpty
                >
                  <MenuItem value="hex">HEX</MenuItem>
                  <MenuItem value="rgb">RGB</MenuItem>
                  <MenuItem value="hsl">HSL</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>
      </Box>
    </div>
  );
};
import _ from "lodash";
import React, { useState, useEffect } from "react";
import { TextField, Chip, Autocomplete } from "@mui/material";

function MultipleSelectChip(props) {
  const [chips, setChips] = useState([]); // Almacena los IDs de los elementos seleccionados.

  useEffect(() => {
    let value = props.dataFound.value;

    // Verifica si es una cadena y trata de parsearla
    if (typeof value === "string") {
      try {
        value = JSON.parse(value); // Convierte la cadena JSON en un objeto/array
      } catch (error) {
        console.error("Error al parsear props.dataFound.value:", error);
        value = []; // Si falla, inicializa como un array vacío
      }
    }

    if (Array.isArray(value)) {
      const initialChips = value.map((item) => item.id);
      setChips(initialChips); // Almacena los IDs
    } else {
      console.warn("props.dataFound.value no es un array:", value);
      setChips([]);
    }
  }, [props.dataFound.value, JSON.stringify(props.dataFound)]);

  // Relación entre nombre y ID
  const nameToIdMap = props.dataFound.showValues.reduce((map, item) => {
    map[item.name] = item.id;
    return map;
  }, {});

  const idToNameMap = props.dataFound.showValues.reduce((map, item) => {
    map[item.id] = item.name;
    return map;
  }, {});

  const handleChange = (event, newValue) => {
    const updatedIds = newValue.map((name) => nameToIdMap[name]);
    setChips(updatedIds); // Actualiza los IDs seleccionados
    if (props.handleIdsChange) {
      props.handleIdsChange(updatedIds); // Notifica los IDs seleccionados
    }
  };

  const handleDelete = (chipToDelete) => () => {
    setChips((chips) => {
      const updatedChips = chips.filter((chip) => chip !== chipToDelete); // Filtra por ID
      if (props.handleIdsChange) {
        props.handleIdsChange(updatedChips); // Notifica los IDs restantes
      }
      return updatedChips;
    });
  };

  // Opciones para mostrar en el autocomplete
  const options = props.dataFound.showValues.map((item) => item.name); // Mostrar nombres

  // Convierte los IDs actuales a nombres para mostrar en las chips
  const chipLabels = chips.map((id) => idToNameMap[id]);

  return (
    <Autocomplete
      multiple
      freeSolo
      readOnly={!props.enableDelete}
      value={chipLabels} // Muestra los nombres correspondientes
      onChange={handleChange}
      options={options} // Opciones como nombres
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={
            props.enableDelete
              ? `${props.dataFound.title}`
              : chips.length > 0
              ? `Hay ${chips.length} ${props.dataFound.title} asociados`
              : ""
          }
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((name, index) => (
          <Chip
            key={name}
            label={name}
            {...getTagProps({ index })}
            onDelete={props.enableDelete ? handleDelete(nameToIdMap[name]) : undefined}
          />
        ))
      }
    />
  );
}

export default MultipleSelectChip;

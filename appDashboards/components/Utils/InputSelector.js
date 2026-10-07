import React, { useState } from 'react'

function InputSelector({ data, setInputValues }) {
    const selectStyles = {
        width: '100%',
        padding: '16.5px 9px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '1.5',
        boxSizing: 'border-box',
        marginTop: '8px',
        boxShadow: 'none',
        outline: 'none',
        transition: 'all 0.2s ease',
    };

    const selectFocusStyles = {
        ...selectStyles,
        borderColor: '#3f51b5',
        boxShadow: '0 0 0 2px rgba(63, 81, 181, 0.2)',
    };

    const handleInputChange = (e, name) => {
        const { value } = e.target;
        setInputValues((prevValues) => 
            prevValues.map((input) => 
            input.name === name ? { ...input, value } : input
        ));
    };

    return (
        <div key={data.name} style={{ marginBottom: '10px' }}>
            <label htmlFor={data.name}>{`${data.label}:`}</label>
            <select
                id={data.name}
                value={data.value || ''}
                onChange={(e) => handleInputChange(e, data.name)}
                style={data.value ? selectFocusStyles : selectStyles}
            >
                <option value="" style={{color: 'rgb(201, 201,201'}} disabled>Selecciona una opción</option>
                {data.options.length > 0 ? (
                    data.options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))
                ) : (
                    <option disabled>No hay opciones disponibles</option>
                )}
            </select>
        </div>
    );
}

export default InputSelector    
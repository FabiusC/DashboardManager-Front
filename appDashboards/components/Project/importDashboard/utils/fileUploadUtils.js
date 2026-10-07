export const MAX_IMPORT_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const formatFileSize = (size) => {
    if (!size) return '0 KB';

    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / (1024 ** index);

    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const validateZipFile = (file) => {
    if (!file?.name?.toLowerCase().endsWith('.ifz')) {
        return {
            isValid: false,
            type: 'format',
            title: 'Formato no admitido',
            description: 'Selecciona un archivo con extensión .ifz.'
        };
    }

    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
        return {
            isValid: false,
            type: 'size',
            title: 'Archivo demasiado grande',
            description: 'El archivo supera el tamaño máximo permitido de 50 MB.'
        };
    }

    return { isValid: true };
};

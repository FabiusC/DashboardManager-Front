/* 
Name: downloads
Action: download files with different formats
*/

import Papa from "papaparse";
import ExcelJS from "exceljs";

const parseDataObjectToArray = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const firstValidRow = data.find((item) => item && typeof item === "object");
    if (!firstValidRow) return [];
    const fields = Object.keys(firstValidRow);
    return data.map((item) => fields.map((field) => item?.[field]));
}
const parseToSnakeCase = (field) => {
    return field
        .trim()
        .replace(/[\s\-]+/g, "_")
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toLowerCase();
};
const parseMetric = (metric) => {
    switch (metric) {
        case "sum":
            return "suma";
        case "avg":
            return "promedio";
        case "count":
            return "cantidad";
        case "min":
            return "minimo";
        case "max":
            return "maximo";
        default:
            return metric;
    }
}
const parseFields = (fieldNames, metric) => {
    if (!Array.isArray(fieldNames) || fieldNames.length === 0) return [];
    const data = fieldNames.map((field) => {
        return parseToSnakeCase(field);
    });
    const lastIndex = data.length - 1;
    if (lastIndex < 0) return data;

    // Solo prefijar métrica cuando exista (evitar "undefined__campo")
    if (metric) {
        const metricParsed = parseMetric(metric);
        data[lastIndex] = `${metricParsed}__${data[lastIndex]}`;
    }
    return data;
}

// Construye nombre de archivo con fecha y hora actual (exportado para uso en UI)
export const buildFileName = (title, ext) => {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    const SS = String(date.getSeconds()).padStart(2, '0');
    const suffix = `${dd}-${mm}-${yyyy}__${HH}h-${MM}m-${SS}s`;
    const safeTitle = (title && String(title).trim()) ? String(title).trim() : 'data';
    return `${safeTitle}_${suffix}.${ext}`;
}

const normalizeDownloadData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.filter((item) => item && typeof item === "object");
}

export const downloadImage = async ({ id, title, fileName }) => {
    if (typeof window === "undefined") return false;
    if (!id) return false;
    const element = document.getElementById(`panel-${id}`);
    if (!element) return false;

    const ignoreId = `actionsPanel-${id}`;
    const ext = "png";
    const finalFileName = fileName ? (fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`) : buildFileName(title, ext);

    try {
        const domtoimage = (await import("dom-to-image-more")).default;
        const dataUrl = await domtoimage.toPng(element, {
            filter: (node) => !(node?.id && node.id === ignoreId),
            bgcolor: "#ffffff",
            cacheBust: true,
        });

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    } catch (err) {
        console.error("Error al generar la imagen:", err);
        return false;
    }
};

// export const downloadPDF = (id, title) => {
//     let node = document.getElementById("contentPanel_" + id);
//     domtoimage.toJpeg(node, { bgcolor: "#F7F7F7" })
//         .then(function (dataUrl) {
//             let image = new Image()
//             image.src = dataUrl
//             image.onload = () => {
//                 const height = image.height > 700 ? image.height + 100 : 800
//                 const pdf = new jsPDF("l", "px", [image.width + 100, height]);
//                 let fileTitle = title != undefined ? title + ".pdf" : "data.pdf"
//                 pdf.addImage(image, 'PNG', 0, 0, image.width, image.height)
//                 pdf.save(fileTitle)
//             }
//         })
// };

export const downloadCSV = ({ title, fieldNames, data, metric, fileName }) => {
    const normalizedData = normalizeDownloadData(data);
    if (normalizedData.length === 0) return false;

    const ext = "csv";
    const finalFileName = fileName ? (fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`) : buildFileName(title, ext);

    const fallbackFieldNames = Object.keys(normalizedData[0] || {});
    const parsedFieldNames = Array.isArray(fieldNames) && fieldNames.length > 0
        ? fieldNames
        : fallbackFieldNames;
    const fields = parseFields(parsedFieldNames, metric);

    const csv = Papa.unparse(
        {
            fields: fields,
            data: parseDataObjectToArray(normalizedData),
        }
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", finalFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
};

export const downloadExcel = async ({ title, fieldNames, data, metric, fileName }) => {
    const normalizedData = normalizeDownloadData(data);
    if (normalizedData.length === 0) return false;

    const ext = "xlsx";
    const finalFileName = fileName ? (fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`) : buildFileName(title, ext);

    const fallbackFieldNames = Object.keys(normalizedData[0] || {});
    const parsedFieldNames = Array.isArray(fieldNames) && fieldNames.length > 0
        ? fieldNames
        : fallbackFieldNames;
    const fields = parseFields(parsedFieldNames, metric);
    const formattedData = parseDataObjectToArray(normalizedData);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.addRow(fields);
    formattedData.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", finalFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
};

export const downloadJSON = ({ title, data, fieldNames, metric, fileName }) => {
    const normalizedData = normalizeDownloadData(data);
    if (normalizedData.length === 0) return false;

    const ext = "json";
    const finalFileName = fileName ? (fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`) : buildFileName(title ? title.toUpperCase() : 'data', ext);

    const fallbackFieldNames = Object.keys(normalizedData[0] || {});
    const parsedFieldNames = Array.isArray(fieldNames) && fieldNames.length > 0
        ? fieldNames
        : fallbackFieldNames;

    const headers = parseFields(parsedFieldNames, metric);
    const sourceKeys = Object.keys(normalizedData[0] || {});

    const parsedJsonData = normalizedData.map((item) => {
        const obj = {};
        const loopLength = Math.min(headers.length, sourceKeys.length);
        for (let i = 0; i < loopLength; i++) {
            const header = headers[i];
            const sourceKey = sourceKeys[i];
            obj[header] = item?.[sourceKey];
        }
        return obj;
    });

    const dataStr = JSON.stringify(parsedJsonData, null, "\t");
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = finalFileName;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    return true;
};

// export const downloadXML = (title, InfoCSV, chartFields) => {
//     if (InfoCSV != undefined) {
//         const filename = title != undefined ? title.toUpperCase() : 'data';
//         let ArrFields = chartFields;
//         /*
//         if (!ArrFields.includes("TOTAL")) {
//             ArrFields.push("TOTAL")
//         }
//         */
//         let concatXML = '';
//         for (let i = 0; i < InfoCSV.length; i++) {
//             concatXML = concatXML + '\t<register>\n';
//             let concatRe = '';
//             ArrFields.map((field) => {
//                 concatRe = concatRe + '\t\t<' + field + '>' + InfoCSV[i][field] + '</' + field + '>\n'
//             });
//             concatXML = concatXML + concatRe + '\t<register>\n'
//         }
//         let dataXML = '<data>\n' + concatXML + '</data>';
//         let dataUri = 'data:application/xml;charset=utf-8,' + encodeURIComponent(dataXML);
//         let exportFileDefaultName = filename + '.xml';
//         let linkElement = document.createElement('a');
//         linkElement.setAttribute('href', dataUri);
//         linkElement.setAttribute('download', exportFileDefaultName);
//         linkElement.click();
//     }
// };
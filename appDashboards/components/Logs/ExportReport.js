import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { mkConfig, generateCsv, download } from 'export-to-csv'; 
import { columnsLogsList,
    columnsHistoricalLogsList
} from './ColumnsLogs';

const staticPrefix       = process.env.staticPrefix;
const availableKeyFilter = ["year", "month", "day_week", "day", "hour", "groups", "users", "object_types", "actions", "status"];

export const handleDownloadReport = (type, userCreator, emailUserCreator, dataFilters, historyLogs) => {
    if (type == "CSV") {
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        const fileName = `reporte_${formattedDate}_${formattedTime.replace(/:/g, '-')}.csv`;

        const csvConfig = mkConfig({
            fieldSeparator: ',',
            decimalSeparator: '.',
            useKeysAsHeaders: true,
            filename: fileName
          });

        const csvData = historyLogs.map(log => {
            const row = {};
            columnsHistoricalLogsList.forEach(col => {
                row[col["header"]] = log[col["accessorKey"]];
            });
            return row;
        });
        const csv = generateCsv(csvConfig)(csvData);
        download(csvConfig)(csv);

    } else if (type == "PDF") {
        jsPDF.autoTableSetDefaults({
            headStyles: { fillColor: 0 },
          })
        const doc = new jsPDF({
            format: 'letter'
        });
        jsPDF.autoTableSetDefaults(
            {
              headStyles: { fillColor: [89, 90, 109] }
            },
            doc
          )
        const title = "Reporte de actividad";
        doc.setFontSize(18);
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        const generationDate = `Fecha de generación: ${formattedDate} ${formattedTime}`;
        const userGenerator = `Usuario generador: ${userCreator}`;
        const emailGenerator = `Email: ${emailUserCreator}`;
        doc.setFontSize(12);
        doc.text(generationDate, 15, 30);
        doc.text(userGenerator, 15, 35);
        doc.text(emailGenerator, 15, 40);
        doc.addImage(`${staticPrefix}/img/logocreangel.png`, "PNG", doc.internal.pageSize.getWidth() - doc.internal.pageSize.getWidth()*(1/7), 4);

        availableKeyFilter.map((key, index) => {
            let [tableHeaders, tableData] = BuildHeaderAndBody(columnsLogsList[key], dataFilters[key]);
            if (dataFilters[key].length > 0) {
                if (index > 0) {
                    autoTable(doc, {
                        startY: doc.lastAutoTable.finalY + 7,
                        head: [tableHeaders],
                        body: tableData,
                        theme: 'grid'
                    });
                } else {
                    autoTable(doc, {
                        startY: 50,
                        head: [tableHeaders],
                        body: tableData,
                        theme: 'grid'
                    });
                }
            } 
        })
        let [tableHeaders, tableData] = BuildHeaderAndBody(columnsHistoricalLogsList, historyLogs);
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 7,
            head: [tableHeaders],
            body: tableData,
            theme: 'grid'
        });
        const fileName = `reporte_${formattedDate}_${formattedTime.replace(/:/g, '-')}.pdf`;
        doc.save(fileName);
    }
}
const BuildHeaderAndBody = (header, data) => {
    const tableHeaders = header.map((c) => c.header);
    const tableAccessKey = header.map((c) => c.accessorKey);
    const tableData = data.map((log) => 
        tableAccessKey.map((key) => {
            if (key === 'Fecha') {
                const date = new Date(log[key]);
                if (!isNaN(date.getTime())) {
                    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
                    return date.toLocaleDateString('es-ES', options);
                } else {
                    return 'Fecha inválida';
                }
            }
            return log[key];
        })
    );
    return [tableHeaders, tableData];
}

import ExcelJS from 'exceljs/dist/exceljs.min.js';

/**
 * Loads the 'AIA-UI-Config' worksheet from the assessment Excel file.
 * @returns {Promise<import('exceljs').Worksheet>}
 */

export async function loadUiConfig(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    return workbook.getWorksheet('AIA-UI-Config');
}

export default loadUiConfig;

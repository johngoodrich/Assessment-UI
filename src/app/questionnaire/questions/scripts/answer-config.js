import Excel from 'exceljs/dist/exceljs.min.js';

export async function loadAnswerConfig() {
    const url = '/assets/AI_Maturity_Assessment.xlsx';
    const workbook = new Excel.Workbook();
    try {
        await workbook.xlsx.load(await fetch(url).then(res => res.arrayBuffer()));

        const worksheet = workbook.getWorksheet('AIA-Question-Response-Map');
        if (!worksheet) {
            throw new Error('Worksheet "AIA-Question-Response-Map" not found in the workbook.');
        }
        return worksheet; // Return the worksheet object so we can iterate rows
    } catch (error) {
        console.error(`Error loading question response configuration from ${url}:`, error);
        throw error; // Rethrow the error after logging
    }
}

export default loadAnswerConfig;

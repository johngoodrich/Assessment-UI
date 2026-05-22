import Excel from 'exceljs/dist/exceljs.min.js';
import { getCellString } from './question-config.js';

// Loads the Excel workbook and retrieves the sheet that maps Question IDs to their possible answers and scores
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

// Iterates through the response map worksheet to create a flat list of answer options
// Used later to filter and attach options to specific questions
export function parseAnswerMap(worksheet) {
    const questionResponses = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip Header

        const qId = getCellString(row.getCell(1));
        if (!qId) return;

        questionResponses.push({
            id: qId,
            response: getCellString(row.getCell(2)),
            score: getCellString(row.getCell(3))
        });
    });
    return questionResponses;
}

export default loadAnswerConfig;

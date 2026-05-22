import Excel from 'exceljs/dist/exceljs.min.js';

// Fetches the master Excel workbook and returns the specific Question Configuration worksheet
export async function loadQuestionConfig(url) {
    const workbook = new Excel.Workbook();
    try {
        await workbook.xlsx.load(await fetch(url).then(res => res.arrayBuffer()));

        const worksheet = workbook.getWorksheet('AIA-Question-Config');
        if (!worksheet) {
            throw new Error('Worksheet "AIA-Question-Config" not found in the workbook.');
        }
        return worksheet; // Return the worksheet object so we can iterate rows
    } catch (error) {
        console.error(`Error loading question configuration from ${url}:`, error);
        throw error; // Rethrow the error after logging
    }
}

// Filters the worksheet rows to find questions matching the user's selected role
export function parseQuestions(worksheet, selectedRole, questionResponses) {
    const excelQuestions = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip Header

        const rowRole = getCellString(row.getCell(2));
        const questionId = getCellString(row.getCell(1));

        if (rowRole === selectedRole) {
            // Build a structured question object, including its mapped responses from the Response Map sheet
            excelQuestions.push({
                id: questionId,
                role: rowRole,
                dimension: getCellString(row.getCell(3)),
                pillar: getCellString(row.getCell(4)),
                dimensionWeight: getCellString(row.getCell(5)),
                question: getCellString(row.getCell(6)),
                responses: questionResponses.filter(q => q.id === questionId) || []
            });
        }
    });
    return excelQuestions;
}

// Utility to safely extract text from various Excel cell types (Static text, RichText, or Formula results)
export function getCellString(cell) {
    const val = cell ? cell.value : null;
    if (val === null || val === undefined) return '';

    // Handle potential RichText objects returned by exceljs
    if (typeof val === 'object' && val.richText) {
        return val.richText.map(rt => rt.text).join('').trim();
    }

    // Handle formulas or numeric values
    const result = (typeof val === 'object' && val.result !== undefined) ? val.result : val;
    return String(result ?? '').trim();
}

export default loadQuestionConfig;

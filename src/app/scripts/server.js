import ExcelJS from 'exceljs';

let workbookCache = null;
const BACKEND_URL = 'http://localhost:3000';

/**
 * Fetches the Excel template from the .NET backend and loads it into an ExcelJS workbook.
 * Caches the workbook for subsequent calls.
 */
export async function ensureWorkbookLoaded() {
    if (workbookCache) return workbookCache;

    try {
        const response = await fetch(`${BACKEND_URL}/api/get-assessment-template`);
        if (!response.ok) throw new Error(`Failed to fetch template: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        workbookCache = workbook;
        return workbookCache;
    } catch (error) {
        console.error('Error in ensureWorkbookLoaded:', error);
        throw error;
    }
}

import ExcelJS from 'exceljs/dist/exceljs.min.js';

// Global cache to store the loaded workbook and prevent repeated network requests
let workbookCache = null;
// URL for the .NET backend API
const BACKEND_URL = 'http://localhost:3000';

/**
 * Fetches the Excel template from the .NET backend and loads it into an ExcelJS workbook.
 * Caches the workbook for subsequent calls.
 */
export async function ensureWorkbookLoaded() {
    // Return cached instance if available
    if (workbookCache) return workbookCache;

    try {
        // Fetch the Excel template as a binary arrayBuffer from the server
        const response = await fetch(`${BACKEND_URL}/api/get-assessment-template`);
        if (!response.ok) throw new Error(`Failed to fetch template: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();

        // Initialize a new ExcelJS workbook and load the binary data
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        // Cache and return the fully initialized workbook
        workbookCache = workbook;
        return workbookCache;
    } catch (error) {
        console.error('Error in ensureWorkbookLoaded:', error);
        throw error;
    }
}

import Chart from 'chart.js/auto';
import Excel from 'exceljs/dist/exceljs.min.js';
import { ensureWorkbookLoaded } from '../../scripts/server.js';

// Global reference for the formatted datasets used by Chart.js
const chartDataset = [];
// Keeps track of the active Chart instance to allow for proper cleanup and memory management
let currentChart = null;

// Reads calculation results and UI styling configurations from the Excel workbook
async function loadChartDatasets() {
	try {
    const workbook = await ensureWorkbookLoaded();
    const calcWorksheet = workbook.getWorksheet('AIA-Calculations');
    const uiWorksheet = workbook.getWorksheet('AIA-UI-Config');

    if (!calcWorksheet || !uiWorksheet) {
      console.error('Required worksheets (Calculations or UI-Config) not found.');
      return;
    }

		const dimensionDataset = [];

    // Iterate through specific rows (Dimensions) in the calculations sheet
    calcWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber <= 5) { // Skip header row and stop after row 5
        const label = row.getCell(1).value;

        // Extract visual styling (colors/width) for this series from the UI-Config sheet
        const backgroundColor = uiWorksheet.getRow(rowNumber).getCell(4).value;
        const borderColor = uiWorksheet.getRow(rowNumber).getCell(5).value;
        const borderWidth = uiWorksheet.getRow(rowNumber).getCell(6).value;

        const data = []

        // Collect the calculated scores for each Pillar (Strategic, Operational, OCM)
        for (let i = 2; i <= 4; i++) { // Columns B, C, D (Calculated results)
          const cellValue = row.getCell(i).value;

          // Handle formula results: ExcelJS provides an object { formula, result } for calculated cells
          const val = (cellValue && typeof cellValue === 'object' && 'result' in cellValue)
            ? cellValue.result
            : cellValue;

          // Ensure the value is a number and default to 0 if empty
          data.push(Number(val) || 0);
        }

        dimensionDataset.push({ label, data, backgroundColor, borderColor, borderWidth });
      }
    });

    // Refresh the global dataset array to ensure accurate rendering on re-loads
    chartDataset.length = 0;
    chartDataset.push(...dimensionDataset);

	}
  catch (error) {
		console.error('Error loading dataset:', error);
	}
}

// Initializes and configures the Radar chart within the provided canvas element
export async function createChart(canvasElement){
  if (!canvasElement) return;

  // If a chart instance already exists, destroy it to clear event listeners and prevent overlapping UI
  if (currentChart) {
    currentChart.destroy();
  }

  const chartType = 'radar';
  // Labels corresponding to the three pillars of AI maturity
  const chartRadarDimensions = ['Strategic Direction', 'Operational Realization', 'Organizational Change Management'];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true, // Forces the scale to start at 0
        min: 0,            // Explicitly sets the minimum value
        max: 5,            // Maturity scale usually goes up to 5
        ticks: {
          stepSize: 0.5    // Sets the interval between scale lines
        }
      }
    },
    plugins: {
          legend: {
              display: true,
              labels: {
                  color: 'rgb(0, 0, 0)'
              }
          }
      }
  };

  // Ensure latest data is parsed from Excel before rendering
  await loadChartDatasets();

  currentChart = new Chart( canvasElement,
    {
      type: chartType,
      data: {
        labels: chartRadarDimensions,
        datasets: chartDataset
      },
      options: chartOptions
  });

  return currentChart;
}

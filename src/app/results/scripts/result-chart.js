import Chart from 'chart.js/auto';
import Excel from 'exceljs/dist/exceljs.min.js';
import { ensureWorkbookLoaded } from '../../scripts/server.js';

const chartDataset = [];

async function loadChartDatasets() {
	try {
		// Use an absolute path from the root. Adjust if your assets folder is named differently.
    const workbook = await ensureWorkbookLoaded();
    const calcWorksheet = workbook.getWorksheet('AIA-Calculations');
    const uiWorksheet = workbook.getWorksheet('AIA-UI-Config');

    if (!calcWorksheet || !uiWorksheet) {
      console.error('Required worksheets (Calculations or UI-Config) not found.');
      return;
    }

		const dimensionDataset = [];

    calcWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber <= 5) { // Skip header row and stop after row 5
        const label = row.getCell(1).value;
        const backgroundColor = uiWorksheet.getRow(rowNumber).getCell(4).value;
        const borderColor = uiWorksheet.getRow(rowNumber).getCell(5).value;
        const borderWidth = uiWorksheet.getRow(rowNumber).getCell(6).value;

        const data = []

        for (let i = 2; i <= 4; i++) { // Columns B, C, D
          const cellValue = row.getCell(i).value;

          // If cell is a formula, ExcelJS returns { formula: '...', result: X }
          // We extract the result, otherwise use the value directly.
          const val = (cellValue && typeof cellValue === 'object' && 'result' in cellValue)
            ? cellValue.result
            : cellValue;

          // Ensure the value is a number and default to 0 if empty
          data.push(Number(val) || 0);
        }

        dimensionDataset.push({ label, data, backgroundColor, borderColor, borderWidth });
      }
    });

    chartDataset.length = 0; // Clear the array to prevent duplicate data on re-renders

		for (const dataset of dimensionDataset) {
			chartDataset.push(
        {
          label: dataset.label,
          data: dataset.data,
          backgroundColor: dataset.backgroundColor,
          borderColor: dataset.borderColor,
          borderWidth: dataset.borderWidth
        }
			)
		}

	}
  catch (error) {
		console.error('Error loading dataset:', error);
	}
}

export async function createChart(canvasElement){
  if (!canvasElement) return;

  const chartType = 'radar'; // Change to 'radar' for radar chart
  const chartRadarDimensions = ['Strategic Direction', 'Operational Realization', 'Organizational Change Management'];
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true, // Forces the scale to start at 0
        min: 0,            // Explicitly sets the minimum value
        max: 5,          // Explicitly sets the maximum value
        ticks: {
          stepSize: 0.5     // Sets the interval between scale lines
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

  await loadChartDatasets();

  return new Chart( canvasElement,
    {
      type: chartType,
      data: {
        labels: chartRadarDimensions,
        datasets: chartDataset
      },
      options: chartOptions
  });
}

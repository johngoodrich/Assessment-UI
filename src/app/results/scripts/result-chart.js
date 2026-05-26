import Chart from 'chart.js/auto';
import { fetchConfig } from '../../scripts/server.js';

// Global reference for the formatted datasets used by Chart.js
const chartDataset = [];
// Keeps track of the active Chart instance to allow for proper cleanup and memory management
let currentChart = null;

// Reads calculation results and UI styling configurations from the Excel workbook
async function loadChartDatasets() {
	try {
    const datasets = await fetchConfig('/api/chart-data');

    // Refresh the global dataset array to ensure accurate rendering on re-loads
    chartDataset.length = 0;
    chartDataset.push(...datasets);

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

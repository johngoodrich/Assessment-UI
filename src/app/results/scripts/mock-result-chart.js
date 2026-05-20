import Chart from 'chart.js/auto';

const chartDataset = [];

async function loadChartDatasets() {
	try {
		// Use an absolute path from the root. Adjust if your assets folder is named differently.
		const response = await fetch('/assets/chart.data.json');

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} at ${response.url}`);
		}

		let data;
		try {
			  data = await response.json();
		} catch (jsonError) {
			  console.error('The server returned something that was not JSON. Check the Network tab in DevTools.');
			throw jsonError;
		}

		const dimensionDataset = data.datasets;
		chartDataset.length = 0; // Clear the array to prevent duplicate data on re-renders

		for (const dataset of dimensionDataset) {
			chartDataset.push(
        {
          label: dataset.label,
          data: JSON.parse(dataset.data),
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
  const chartRadarDimensions = ['Governance & Oversight', 'Strategy & Value Realization', 'Responsible AI & Risk Management',
                                  'Operating Model & Enablement', 'Technology & Architecture'];
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

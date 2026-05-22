import { createChart } from './result-chart.js';
import { ensureWorkbookLoaded } from '../../scripts/server.js';

// Web Component to display the AI Maturity Assessment results and maturity band definitions
export class ResultComponent extends HTMLElement {
  constructor() {
    super();
    // Encapsulate styles and markup within Shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  // Define the base structure and link the external stylesheet
  render() {
    console.log('ResultComponent: Initializing shadow DOM...');
    this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="../results.css">
        <div class="results-layout">
          <div class="chart-section">
            <h1>AI Maturity Assessment Results</h1>
            <canvas id="result-canvas"></canvas>
          </div>
          <div class="bands-section">
            <h2>Maturity Bands</h2>
            <div id="maturity-band-content">Loading definitions...</div>
          </div>
        </div>
    `;
  }

  // Standard component lifecycle method called when added to the DOM
  connectedCallback() {
    this.render();
    this.init();
  }

  // Orchestrates the loading of the radar chart and the maturity band data
  async init() {
    const canvas = this.shadowRoot.getElementById('result-canvas');
    if (canvas) {
      try {
        // createChart is async and handles its own workbook loading via ensureWorkbookLoaded
        await createChart(canvas);
      } catch (err) {
        console.error("Chart initialization failed:", err);
      }
    }
    await this.populateMaturityBands();
  }

  // Parses the 'AIA-UI-Config' sheet to display the maturity levels and their scores
  async populateMaturityBands() {
    const contentArea = this.shadowRoot.getElementById('maturity-band-content');
    try {
      const workbook = await ensureWorkbookLoaded();
      // Get the configuration sheet which contains band definitions (Level 1-5)
      const sheet = workbook.getWorksheet('AIA-UI-Config');

      if (!sheet) {
        contentArea.innerHTML = '<p>Configuration sheet not found.</p>';
        return;
      }

      let html = '';
      // ExcelJS rows are 1-indexed. Assuming Row 1 is Headers.
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const bandName = row.getCell(2).value; // Column B
          const score = row.getCell(3).value; // Column C
          if (bandName) {
            html += `
              <div class="band-label">${bandName}:</div>
              <div class="band-score">${score || ''}</div>`;
          }
        }
      });
      contentArea.innerHTML = html || '<p>No maturity definitions were found in the workbook.</p>';
    } catch (error) {
      console.error('Failed to populate maturity bands:', error);
      contentArea.innerHTML = '<p>Error loading configuration data.</p>';
    }
  }
}

// Register the custom element globally if not already defined
if (!customElements.get('result-component')) {
    customElements.define('result-component', ResultComponent);
  }

export default ResultComponent;

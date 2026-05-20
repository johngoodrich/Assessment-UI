import { createChart } from './mock-result-chart.js';

export class MockResult extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  render() {
    this.shadowRoot.innerHTML = `
        <style>
          canvas {
              width: 100% !important;
              height: 500px !important;
              display: block; /* avoids inline spacing issues */
            }
        </style>
        <div class="container">
          <h1>AI Maturity Assessment Results</h1>
        </div>
        <div>
          <canvas id="mock-result-canvas"></canvas>
        </div>
      `;
    }


  connectedCallback() {
    this.render();
    this.init();
  }

  init() {
    const canvas = this.shadowRoot.getElementById('mock-result-canvas');
    createChart(canvas);
  }

}


if (!customElements.get('mock-result')) {
    customElements.define('mock-result', MockResult);
  }

export default MockResult;

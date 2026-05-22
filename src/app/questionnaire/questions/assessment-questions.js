import { loadQuestionConfig } from './scripts/question-config.js';
import { loadAnswerConfig } from './scripts/answer-config.js';
import { ensureWorkbookLoaded } from '../../scripts/server.js';

export class AssessmentQuestions extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.state = {
                allQuestions: [],
                currentRoleQuestions: [],
                currentQuestionIndex: 0,
                userResponses: {}
            };
        }

        render() {
            this.shadowRoot.innerHTML = `
                <style>
                    :host { display: block; font-family: Arial, sans-serif; }
                    .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); width: 100%; max-width: 600px; text-align: center; margin: 0 auto; }
                    h1, h2, h3 { color: #333; }
                    #role-selector-section, #questionnaire-section { margin-top: 20px; }
                    #role-selector { padding: 10px; width: 80%; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
                    .hidden { display: none; }
                    #question-container { margin-top: 20px; text-align: left; }
                    #current-question-text { font-size: 18px; margin-bottom: 15px; color: #555; }
                    #response-options label { display: block; margin-bottom: 10px; font-size: 16px; cursor: pointer; }
                    #response-options input[type="radio"] { margin-right: 10px; }
                    #submit-response { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 20px; }
                    #submit-response:hover { background-color: #0056b3; }
                    #thank-you-message { margin-top: 30px; color: #28a745; }
                </style>
                <div class="container">
                    <h1>AI Maturity Assessment</h1>
                    <div id="role-selector-section">
                        <h2>Select Your Role</h2>
                        <select id="role-selector">
                            <option value="">--Please choose an option--</option>
                        </select>
                    </div>
                    <div id="questionnaire-section" class="hidden">
                        <h2>Questionnaire for <span id="selected-role-display"></span></h2>
                        <div id="question-container">
                            <p id="current-question-text"></p>
                            <div id="response-options"></div>
                            <button id="submit-response">Submit Response</button>
                        </div>
                        <div id="thank-you-message" class="hidden">
                            <h3>Thank you for completing the questionnaire!</h3>
                            <p>Your responses have been recorded.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        connectedCallback() {
            this.render();
            this.init(); // Call init after rendering to get element references
        }

        init() {
            const qs = (id) => this.shadowRoot.getElementById(id);
            this.els = {
                roleSelector: qs('role-selector'),
                roleSelectorSection: qs('role-selector-section'),
                questionnaireSection: qs('questionnaire-section'),
                selectedRoleDisplay: qs('selected-role-display'),
                questionText: qs('current-question-text'),
                responseOptions: qs('response-options'),
                submitBtn: qs('submit-response'),
                thankYou: qs('thank-you-message')
            };

            // Populate roles from Excel config
            this.populateRoles();

            this.els.roleSelector.addEventListener('change', (e) => this.handleRoleSelection(e.target.value));
            this.els.submitBtn.addEventListener('click', () => this.handleSubmit());
        }

        async ensureWorkbookLoaded() {
            if (this.workbookInstance) return;
            this.workbookInstance = await ensureWorkbookLoaded();
        }

        async populateRoles() {
            try {
                await this.ensureWorkbookLoaded();
                const uiWorksheet = this.workbookInstance.getWorksheet('AIA-UI-Config');
                if (!uiWorksheet) {
                    this.els.roleSelector.innerHTML = '<p>Configuration sheet not found.</p>';
                    return;
                }

                // Clear existing and keep placeholder
                this.els.roleSelector.innerHTML = '<option value="">--Please choose an option--</option>';

                uiWorksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip Header
                    const role = this.getCellString(row.getCell(1));
                    if (role) {
                        const option = document.createElement('option');
                        option.value = role;
                        option.textContent = role;
                        this.els.roleSelector.appendChild(option);
                    }
                });
            } catch (error) {
                console.error('Failed to populate roles from Excel:', error.message);
            }
        }

        // Helper to get string value from a cell (handles RichText and whitespace)
        getCellString(cell) {
            const val = cell.value;
            if (!val) return '';
            if (typeof val === 'object' && val.richText) {
                return val.richText.map(rt => rt.text).join('').trim();
            }
            return String(val).trim();
        }

        async loadQuestions(selectedRole) {
            try {
                await this.ensureWorkbookLoaded();

                try {
                    const worksheet = this.workbookInstance.getWorksheet('AIA-Question-Config');
                    const answerWorksheet = this.workbookInstance.getWorksheet('AIA-Question-Response-Map');

                    if (!worksheet || !answerWorksheet) throw new Error('Required worksheets not found in workbook');

                    // Pre-build a map of responses keyed by the Question ID for efficient lookup
                    const questionResponses = [];
                    answerWorksheet.eachRow((row, rowNumber) => {
                        if (rowNumber === 1) return; // Skip Header

                        const qId = this.getCellString(row.getCell(1));
                        if (!qId) return;

                        const responseText = this.getCellString(row.getCell(2));
                        const responseScore = this.getCellString(row.getCell(3));

                        questionResponses.push({
                            id: qId,
                            response: responseText,
                            score: responseScore
                        });
                    });

                    const excelQuestions = [];
                    worksheet.eachRow((row, rowNumber) => {
                        if (rowNumber === 1) return; // Skip Header

                        // Normalize role and ID for exact matching
                        const rowRole = this.getCellString(row.getCell(2));
                        const questionId = this.getCellString(row.getCell(1));

                        if (rowRole === selectedRole) {
                            excelQuestions.push({
                              id: questionId,
                              role: rowRole,
                              dimension: this.getCellString(row.getCell(3)),
                              pillar: this.getCellString(row.getCell(4)),
                              dimensionWeight: this.getCellString(row.getCell(5)),
                              question: this.getCellString(row.getCell(6)),
                              responses: questionResponses.filter(q => q.id === questionId) || []
                            });
                        }
                    });

                    this.state.currentRoleQuestions = excelQuestions;
                    console.log(`Loaded ${excelQuestions.length} questions from Excel for role: ${selectedRole}`);
                } catch (excelError) {
                    console.error('Failed to process Excel data:', excelError.message);
                }
            } catch (error) {
                console.error('Error loading questions:', error.message);
                this.els.questionText.textContent = `Error: Could not load questions from server.`;
            }
        }

        async handleRoleSelection(role) {
            if (!role) return;

            // Pass the role to the loader so it can filter Excel rows
            await this.loadQuestions(role);

            this.state.currentQuestionIndex = 0;
            this.state.userResponses = {};

            this.els.selectedRoleDisplay.textContent = role;
            this.els.roleSelectorSection.classList.add('hidden');
            this.els.questionnaireSection.classList.remove('hidden');
            this.els.thankYou.classList.add('hidden');

            if (this.state.currentRoleQuestions.length > 0) {
                this.displayQuestion();
            }
        }

        displayQuestion() {
            const question = this.state.currentRoleQuestions[this.state.currentQuestionIndex];
            this.els.questionText.textContent = question.question;
            this.els.responseOptions.innerHTML = '';

            question.responses.forEach(option => {
                const label = document.createElement('label');
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'currentQuestionResponse';
                input.value = option.response;
                label.appendChild(input);
                label.appendChild(document.createTextNode(option.response));
                this.els.responseOptions.appendChild(label);
            });
        }

        async captureResponse(role, questionId, responseText, responseScore) {
            try {
                // Re-fetch the latest workbook from the server to sync with data from other sessions
                // and avoid overwriting concurrent updates when saving.
                this.workbookInstance = await ensureWorkbookLoaded();

                let captureSheet = this.workbookInstance.getWorksheet('AIA-Response-Capture');
                if (!captureSheet) {
                    captureSheet = this.workbookInstance.addWorksheet('AIA-Response-Capture');
                }

                // Ensure headers are present only if the sheet is empty to prevent overwriting existing rows
                if (captureSheet.actualRowCount === 0) {
                    captureSheet.addRow(['Respondent Role', 'Question ID', 'Chosen Response', 'Response Score']);
                }

                // Append the response data to the next available row (Columns A, B, C, and D)
                captureSheet.addRow([role, questionId, responseText, responseScore]);
                console.log(`Captured response for ${questionId} in Excel (Role: ${role})`);
            } catch (error) {
                console.error('Failed to capture response to Excel:', error);
            }
        }

        async sendResultsToServer() {
            if (!this.workbookInstance) return;

            try {
                // Generate the binary buffer from the in-memory workbook
                const buffer = await this.workbookInstance.xlsx.writeBuffer();

                // Send the buffer to a server endpoint
                const response = await fetch('http://localhost:3000/api/save-assessment-results', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'X-Filename': 'AI_Maturity_Assessment.xlsx' // Use the exact filename for the server to overwrite
                    },
                    body: buffer // Send the raw ArrayBuffer
                });

                if (response.ok) {
                    console.log('Assessment results successfully sent to server.');
                    // Optionally, you can get a response from the server, e.g., a URL to the saved file
                    // const serverResponse = await response.json();
                    // console.log('Server response:', serverResponse);
                } else {
                    console.error('Failed to send assessment results to server:', response.status, response.statusText);
                }

            } catch (error) {
                console.error('Failed to export Excel file:', error);
            }
        }

        async handleSubmit() {
            const selected = this.shadowRoot.querySelector('input[name="currentQuestionResponse"]:checked');
            if (!selected) {
                alert('Please select an answer before submitting.');
                return;
            }

            const question = this.state.currentRoleQuestions[this.state.currentQuestionIndex];
            const role = this.els.roleSelector.value;
            const responseText = this.state.currentRoleQuestions[this.state.currentQuestionIndex]
              .responses.find(r => r.response === selected.value)?.response || selected.value;
            const responseScore = parseInt(this.state.currentRoleQuestions[this.state.currentQuestionIndex]
              .responses.find(r => r.response === selected.value)?.score) || 0;

            // Capture response to the persistent Excel worksheet object
            await this.captureResponse(role, question.id, responseText, responseScore);

            // Send the updated workbook to the server after every question
            await this.sendResultsToServer();

            this.state.currentQuestionIndex++;

            if (this.state.currentQuestionIndex < this.state.currentRoleQuestions.length) {
                this.displayQuestion();
            } else {
                this.els.questionnaireSection.classList.add('hidden');
                this.els.thankYou.classList.remove('hidden');

                // Dispatch a custom event for the parent to handle the data
                this.dispatchEvent(new CustomEvent('assessment-completed', {
                    detail: { responses: this.state.userResponses },
                    bubbles: true,
                    composed: true
                }));
            }
        }
    }

    if (!customElements.get('assessment-questions')) {
        customElements.define('assessment-questions', AssessmentQuestions);
    }

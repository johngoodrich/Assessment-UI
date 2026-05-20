import { loadQuestionConfig } from './scripts/question-config.js';
import { loadAnswerConfig } from './scripts/answer-config.js';
import { loadUiConfig } from './scripts/ui-config.js';

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

        async populateRoles() {
            try {
                const uiWorksheet = await loadUiConfig();
                if (!uiWorksheet) throw new Error('AIA-UI-Config worksheet not found');

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
            const url = this.getAttribute('questions-url') || 'questions.data.json';
            try {
                // Optional: You can still load JSON as a fallback or base
                // const response = await fetch(url);
                // const data = await response.json();
                // this.state.allQuestions = data.questions;

                // Load from Excel
                try {
                    const [worksheet, answerWorksheet] = await Promise.all([
                        loadQuestionConfig(),
                        loadAnswerConfig()
                    ]);

                    // Pre-build a map of responses keyed by the Question ID for efficient lookup
                    const responseMap = new Map();
                    answerWorksheet.eachRow((row, rowNumber) => {
                        if (rowNumber === 1) return; // Skip Header
                        const qId = String(row.getCell(1).value).trim();
                        const responses = [];

                        // Loop through cells 2-8 to gather the 7 response options
                        for (let i = 2; i <= 8; i++) {
                            const responseText = row.getCell(i).value;
                            if (responseText) {
                                responses.push({
                                    id: i - 1, // Create a 1-indexed ID for the option
                                    text: responseText
                                });
                            }
                        }
                        responseMap.set(qId, responses);
                    });

                    const excelQuestions = [];
                    worksheet.eachRow((row, rowNumber) => {
                        if (rowNumber === 1) return; // Skip Header

                        // Normalize role and ID for exact matching
                        const rowRole = this.getCellString(row.getCell(2));
                        const questionId = String(row.getCell(1).value).trim();

                        if (rowRole === selectedRole) {
                            excelQuestions.push({
                              id: questionId,
                              role: rowRole,
                              domain: row.getCell(3).value, // Assuming domain is in the third column
                              subSection: row.getCell(4).value, // Assuming subsection is in the fourth column
                              subsectionGoal: row.getCell(5).value,
                              subsectionWeight: row.getCell(6).value,
                              question: row.getCell(7).value,
                              // Example of mapping static responses or parsing more columns
                              response: responseMap.get(questionId) || []
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
                this.els.questionText.textContent = `Error: Could not load questions. Please verify that the file exists at ${url}`;
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

            question.response.forEach(option => {
                const label = document.createElement('label');
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'currentQuestionResponse';
                input.value = option.id;
                label.appendChild(input);
                label.appendChild(document.createTextNode(option.text));
                this.els.responseOptions.appendChild(label);
            });
        }

        handleSubmit() {
            const selected = this.shadowRoot.querySelector('input[name="currentQuestionResponse"]:checked');
            if (!selected) {
                alert('Please select an answer before submitting.');
                return;
            }

            const question = this.state.currentRoleQuestions[this.state.currentQuestionIndex];
            this.state.userResponses[question.goal] = selected.value;
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

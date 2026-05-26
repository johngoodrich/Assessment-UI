import { fetchConfig } from '../../scripts/server.js';

export class AssessmentQuestions extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.state = {
                allQuestions: [],
                currentRoleQuestions: [],
                currentQuestionIndex: 0,
                userResponses: [] // Changed to array to store normalized objects
            };
        }

        // Defines the internal HTML structure and links the external stylesheet
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

        // Requirement #4: Cleanup state if the user navigates away mid-assessment
        disconnectedCallback() {
            this.state.userResponses = [];
            this.state.currentQuestionIndex = 0;
            console.log('AssessmentQuestions: Component detached, state reset.');
        }

        // Caches DOM references and binds event listeners
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

            this.populateRoles();

            this.els.roleSelector.addEventListener('change', (e) => this.handleRoleSelection(e.target.value));
            this.els.submitBtn.addEventListener('click', () => this.handleSubmit());
        }

        // Fetches roles from the backend API
        async populateRoles() {
            try {
                const roles = await fetchConfig('/api/config/roles');

                // Clear existing and keep placeholder
                this.els.roleSelector.innerHTML = '<option value="">--Please choose an option--</option>';

                roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role;
                    option.textContent = role;
                    this.els.roleSelector.appendChild(option);
                });
            } catch (error) {
                console.error('Failed to populate roles:', error.message);
            }
        }

        // Fetches role-specific questions from the backend API
        async loadQuestions(selectedRole) {
            try {
                const questions = await fetchConfig(`/api/config/questions?role=${encodeURIComponent(selectedRole)}`);
                this.state.currentRoleQuestions = questions;
                console.log(`Loaded ${questions.length} questions for role: ${selectedRole}`);
            } catch (error) {
                console.error('Error loading questions:', error.message);
                this.els.questionText.textContent = `Error: Could not load questions from server.`;
            }
        }

        // Transitions the UI from role selection to the questionnaire
        async handleRoleSelection(role) {
            if (!role) return;

            // Pass the role to the loader so it can filter Excel rows
            await this.loadQuestions(role);

            this.state.currentQuestionIndex = 0;
            this.state.userResponses = [];

            this.els.selectedRoleDisplay.textContent = role;
            this.els.roleSelectorSection.classList.add('hidden');
            this.els.questionnaireSection.classList.remove('hidden');
            this.els.thankYou.classList.add('hidden');

            if (this.state.currentRoleQuestions.length > 0) {
                this.displayQuestion();
            }
        }

        // Renders the current question and generates radio buttons for each response option
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

        // Requirement #2: Capture response as a normalized JSON object in the local state
        async captureResponse(role, questionId, responseText, responseScore) {
            this.state.userResponses.push({
                role,
                questionId,
                responseText,
                responseScore
            });
            console.log(`Captured local response for ${questionId}`);
        }

        // Requirement #3: Send the array of normalized objects to the server
        async sendResultsToServer(data) {
            if (!data || data.length === 0) return;

            try {
                const response = await fetch('/api/save-assessment-results', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    console.log('Assessment results successfully sent to server.');
                } else {
                    console.error('Failed to send assessment results to server:', response.status, response.statusText);
                }

            } catch (error) {
                console.error('Failed to export Excel file:', error);
            }
        }

        // Logic for the 'Submit Response' button: saves the answer, syncs with server, and moves to the next question
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
            this.captureResponse(role, question.id, responseText, responseScore);

            this.state.currentQuestionIndex++;

            if (this.state.currentQuestionIndex < this.state.currentRoleQuestions.length) {
                this.displayQuestion();
            } else {
                // Requirement #4: Save at the end over saving after each question
                await this.sendResultsToServer(this.state.userResponses);

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

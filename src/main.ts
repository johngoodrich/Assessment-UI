import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Imports for the question component and related configuration scripts. This ensures that the Web Component displays
// the questions and answers as defined in the Excel configuration file.
import './app/questionnaire/questions/assessment-questions.js';
import './app/questionnaire/questions/scripts/question-config.js';
import './app/questionnaire/questions/scripts/answer-config.js';
import './app/scripts/server.js';

import './app/results/scripts/result-chart.js';
import './app/results/scripts/result.js';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

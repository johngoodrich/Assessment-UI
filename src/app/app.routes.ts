import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Results } from './results/results';
import { Questionnaire } from './questionnaire/questionnaire';

export const routes: Routes = [
  { path: '', component: Home, title: 'AI Maturity - Home' },
  { path: 'questionnaire', component: Questionnaire, title: 'AI Maturity - Assessment' },
  { path: 'results', component: Results, title: 'Assessment - Results' },
  { path: '**', redirectTo: '' }
];

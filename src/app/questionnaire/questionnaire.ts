import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './questionnaire.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class Questionnaire {
  isSubmitted = false;

  constructor(private router: Router) {}

  onAssessmentCompleted(event: Event) {
    // The data is contained within event.detail.responses as defined in the Web Component
    const responses = (event as CustomEvent).detail.responses;
    console.log('Role-specific responses received:', responses);
    this.isSubmitted = true;

    // Navigate to the results route.
    // Ensure this path matches your route configuration in app.routes.ts
    this.router.navigate(['/results']);
  }

  onSubmit() {
      this.isSubmitted = true;
      // Logic to calculate maturity score would go here
    }
  }


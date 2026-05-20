import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Questionnaire } from './questionnaire';

describe('Questionnaire', () => {
  let component: Questionnaire;
  let fixture: ComponentFixture<Questionnaire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Questionnaire],
    }).compileComponents();

    fixture = TestBed.createComponent(Questionnaire);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

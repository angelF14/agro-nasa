import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgronomistParcelContext } from '@models/index';
import { AgronomistAssistantComponent } from './agronomist-assistant';

describe('AgronomistAssistantComponent', () => {
  let fixture: ComponentFixture<AgronomistAssistantComponent>;
  let httpMock: HttpTestingController;

  const baseContext: AgronomistParcelContext = {
    coordinates: { lat: 14.5, lon: -87.2 },
    locationName: 'Comayagua, Honduras',
    localContext: {
      soilObservations: [],
      priorities: ['soil-regeneration', 'water-conservation'],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgronomistAssistantComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgronomistAssistantComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('context', baseContext);
    fixture.componentRef.setInput('mode', 'panel');
    fixture.detectChanges();

    const statusReqs = httpMock.match('/api/agronomist/status');
    for (const req of statusReqs) {
      req.flush({
        configured: false,
        defaultModel: 'gemini-3.6-flash',
        fallbackModel: 'gemini-3.5-flash-lite',
      });
    }
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('toggles mobile context sidebar visibility and updates aria-expanded', () => {
    const el = fixture.nativeElement as HTMLElement;
    const toggleBtn = el.querySelector('.mobile-ctx-toggle') as HTMLButtonElement;
    const sidebar = el.querySelector('#ai-sidebar-panel') as HTMLElement;

    expect(toggleBtn).toBeTruthy();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    expect(sidebar.classList.contains('is-mobile-open')).toBeFalse();
    expect(el.querySelector('.mobile-ctx-toggle__summary')?.textContent).toContain('Comayagua');

    toggleBtn.click();
    fixture.detectChanges();

    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(sidebar.classList.contains('is-mobile-open')).toBeTrue();
  });

  it('keeps unique API key input ids between panel and drawer modes', () => {
    const el = fixture.nativeElement as HTMLElement;
    const inputs = el.querySelectorAll('input[id^="gemini-key-input-"]');
    const ids = Array.from(inputs).map((input) => input.id);

    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
  });
});

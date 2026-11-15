import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let languageService: LanguageService;

  beforeEach(() => {
    window.localStorage.removeItem('agro-nasa-language');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    languageService = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    window.localStorage.removeItem('agro-nasa-language');
  });

  it('starts in English and translates UI text', () => {
    expect(languageService.language()).toBe('en');
    expect(languageService.t('Cultivos')).toBe('Crops');
    expect(languageService.t('Maíz')).toBe('Maíz');
  });

  it('switches languages and persists the selection', () => {
    languageService.toggle();

    expect(languageService.language()).toBe('es');
    expect(languageService.t('Cultivos')).toBe('Cultivos');
    expect(window.localStorage.getItem('agro-nasa-language')).toBe('es');

    languageService.toggle();

    expect(languageService.language()).toBe('en');
    expect(window.localStorage.getItem('agro-nasa-language')).toBe('en');
  });
});

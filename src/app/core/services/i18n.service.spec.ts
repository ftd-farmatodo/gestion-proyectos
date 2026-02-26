import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('translates a known key', () => {
    const result = service.t('common.save');
    expect(result).toBe('Guardar');
  });

  it('returns key when key is missing', () => {
    const result = service.t('nonexistent.key.path');
    expect(result).toBe('nonexistent.key.path');
  });

  it('translates nested keys', () => {
    const result = service.t('common.priorityUpdated');
    expect(result).toBe('Prioridad actualizada.');
  });
});

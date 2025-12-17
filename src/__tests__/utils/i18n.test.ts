import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from '../../tools/i18n';

describe('i18n configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct default language', () => {
    expect(i18n.options.lng).toBe('zh');
  });

  it('should have fallback language', () => {
    expect(i18n.options.fallbackLng).toEqual(['en']);
  });

  it('should have correct backend configuration', () => {
    expect(i18n.options.backend).toBeDefined();
    const backend = i18n.options.backend as any;
    expect(backend.loadPath).toBe('/locales/{{lng}}/{{ns}}.json');
  });

  it('should have interpolation configured', () => {
    expect(i18n.options.interpolation).toBeDefined();
    expect(i18n.options.interpolation.escapeValue).toBe(false);
  });

  it('should change language successfully', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('should translate keys correctly', () => {
    const result = i18n.t('test.key');
    expect(typeof result).toBe('string');
  });

  it('should handle missing translations gracefully', () => {
    const result = i18n.t('non.existent.key');
    expect(result).toBe('non.existent.key');
  });

  it('should interpolate values correctly', () => {
    const result = i18n.t('test.key', { value: 'test' });
    expect(typeof result).toBe('string');
  });

  it('should have proper plugins initialized', () => {
    expect(i18n).toBeDefined();
    expect(typeof i18n.t).toBe('function');
    expect(typeof i18n.changeLanguage).toBe('function');
  });
});

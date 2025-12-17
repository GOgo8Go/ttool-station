module.exports = {
  locales: ['en', 'zh', 'jp', 'kr', 'ru', 'fr'],
  defaultNamespace: 'translation',
  output: 'public/locales/$LOCALE/$NAMESPACE.json',
  input: ['../src/**/*.{ts,tsx}', '../src/.iNeedTheseTranslation.tsx', '!../src/__tests__/**'],
  options: {
    defaultValue: null,
    removeUnusedKeys: false,
    sort: false,
    indentation: 2
  }
};
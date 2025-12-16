module.exports = {
  locales: ['en', 'zh', 'jp', 'kr', 'ru'],
  defaultNamespace: 'translation',
  output: 'public/locales/$LOCALE/$NAMESPACE.json',
  input: ['../src/**/*.{ts,tsx}'],
  options: {
    defaultValue: null,
    removeUnusedKeys: false,
    sort: false,
    indentation: 2
  }
};
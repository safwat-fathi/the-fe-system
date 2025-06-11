const { FlatCompat } = require('@eslint/eslintrc');
const eslintrc = require('./.eslintrc.json');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...compat.config({
    ...eslintrc,
    parser: require.resolve('@typescript-eslint/parser'),
  }).map((c) => ({
    ...c,
    files: ['**/*.{js,jsx,ts,tsx}'],
  })),
  {
    ignores: [
      '.now/*',
      '*.css',
      '.changeset',
      'dist',
      'esm/*',
      'public/*',
      'tests/*',
      'scripts/*',
      '*.config.js',
      '.DS_Store',
      'node_modules',
      'coverage',
      '.next',
      'build',
    ],
  },
];

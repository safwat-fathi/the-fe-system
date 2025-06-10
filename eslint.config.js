const { FlatCompat } = require('@eslint/eslintrc');
const eslintrc = require('./.eslintrc.json');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...compat.config({
    ...eslintrc,
    parser: require.resolve('@typescript-eslint/parser'),
  }),
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

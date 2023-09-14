/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

const e = require('../../.eslintrc');

module.exports = {
  ...e,
  rules: {
    ...e.rules,
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['server/*'],
            message: 'Do not import server stuff to shared',
          },
          {
            group: ['client/*'],
            message: 'Do not import client stuff to shared',
          },
          {
            group: ['shared/*'],
            message: 'Do not use the shared import in shared',
          },
          {
            group: ['integration/*'],
            message: 'Do not import integration stuff to shared',
          },
        ],
      },
    ],
  },
};

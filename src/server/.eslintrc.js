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
            group: ['client/*'],
            message: 'Do not import client stuff to server',
          },
          {
            group: ['shared/*/*'],
            message: 'Only use first-level exports from shared',
          },
          {
            group: ['integration/*'],
            message: 'Do not import integration stuff to server',
          },
        ],
      },
    ],
  },
};

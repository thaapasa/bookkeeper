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
            message: 'Do not import server stuff to client',
          },
          {
            group: ['shared/*/*'],
            message: 'Only use first-level exports from shared',
          },
          {
            group: ['integration/*'],
            message: 'Do not import integration stuff to client',
          },
        ],
      },
    ],
  },
};

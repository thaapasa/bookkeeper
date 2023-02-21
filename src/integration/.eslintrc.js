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
            group: ['shared/*/*', '!shared/*/test', 'shared/*/test/*'],
            message: 'Only use first-level exports from shared',
          },
        ],
      },
    ],
  },
};

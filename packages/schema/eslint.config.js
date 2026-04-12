import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nextreport/*'],
              message: 'schema must not import from any @nextreport/* package',
            },
          ],
        },
      ],
    },
  },
]

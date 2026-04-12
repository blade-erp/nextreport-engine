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
              group: ['react', 'react-dom', 'react/*'],
              message: 'renderer-pdf must not import React',
            },
            {
              group: ['next', 'next/*'],
              message: 'renderer-pdf must not import Next.js',
            },
            {
              group: ['konva', 'react-konva'],
              message: 'renderer-pdf must not import Konva',
            },
            {
              group: ['@nextreport/canvas*'],
              message: 'renderer-pdf must not import canvas',
            },
            {
              group: ['@nextreport/ui-*'],
              message: 'renderer-pdf must not import UI packages',
            },
          ],
        },
      ],
    },
  },
]

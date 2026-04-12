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
              message: 'engine-core must not import React',
            },
            {
              group: ['next', 'next/*'],
              message: 'engine-core must not import Next.js',
            },
            {
              group: ['konva', 'react-konva'],
              message: 'engine-core must not import Konva',
            },
            {
              group: ['@nextreport/canvas*'],
              message: 'engine-core must not import canvas',
            },
            {
              group: ['@nextreport/renderer*'],
              message: 'engine-core must not import renderers',
            },
            {
              group: ['@nextreport/ui-*'],
              message: 'engine-core must not import UI packages',
            },
          ],
        },
      ],
    },
  },
]

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
              message: 'renderer-html must not import React',
            },
            {
              group: ['next', 'next/*'],
              message: 'renderer-html must not import Next.js',
            },
            {
              group: ['konva', 'react-konva'],
              message: 'renderer-html must not import Konva',
            },
            {
              group: ['@nextreport/canvas*'],
              message: 'renderer-html must not import canvas',
            },
            {
              group: ['@nextreport/ui-*'],
              message: 'renderer-html must not import UI packages',
            },
          ],
        },
      ],
    },
  },
]

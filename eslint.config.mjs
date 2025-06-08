import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/build',
      '**/.next',
      '**/coverage',
      '**/node_modules',
      '**/node_modules/**',
      'packages/**/node_modules/**',
      'apps/**/node_modules/**',
      '**/.vite/**',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/.cache',
      '**/.parcel-cache',
      '**/.nyc_output',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/.vscode',
      '**/.idea',
      '**/*.tmp',
      '**/*.temp',
      '**/*.log',
      '**/npm-debug.log*',
      '**/pnpm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.env.local',
      '**/.env.*.local',
      '.nx',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];

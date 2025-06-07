import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      // Build outputs
      '**/dist',
      '**/build',
      '**/.next',
      '**/coverage',

      // Dependencies - more comprehensive patterns
      '**/node_modules',
      '**/node_modules/**',
      'packages/**/node_modules/**',
      'apps/**/node_modules/**',

      // Vite and other build tools
      '**/.vite/**',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',

      // Generated files
      '**/*.min.js',
      '**/*.bundle.js',

      // Cache directories
      '**/.cache',
      '**/.parcel-cache',
      '**/.nyc_output',

      // OS and IDE files
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/.vscode',
      '**/.idea',

      // Temporary files
      '**/*.tmp',
      '**/*.temp',

      // Log files
      '**/*.log',
      '**/npm-debug.log*',
      '**/pnpm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',

      // Environment files
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

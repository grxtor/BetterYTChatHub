import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextVitals,
  {
    settings: {
      next: {
        rootDir: 'client',
      },
    },
    ignores: [
      'client/.next/**',
      'client/.next-cache*/**',
      'backend/dist/**',
      'electron/dist/**',
      'release/**',
      'node_modules/**',
    ],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
    },
  },
];

export default config;

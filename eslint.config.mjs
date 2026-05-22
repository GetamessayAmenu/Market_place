import base from '@marketplace/eslint-config/base';

/** Root ESLint — workspace packages define their own configs. */
export default [
  ...base,
  {
    ignores: [
      'apps/**',
      'services/**',
      'packages/**',
      'infra/**',
      'prisma/**',
      'node_modules/**',
    ],
  },
];

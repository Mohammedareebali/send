const base = require('../../jest.config.base');

module.exports = {
  ...base,
  testMatch: ['**/?(*.)+(test).ts'],
  moduleNameMapper: {
    '^@send/shared$': '<rootDir>/src',
    '^@send/shared/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
};

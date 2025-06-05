module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@send/shared$': '<rootDir>/../shared/src',
    '^@send/shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1'
  }
};

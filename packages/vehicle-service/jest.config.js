module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@send/shared$': '<rootDir>/../../shared/src',
    '^@send/shared/(.*)$': '<rootDir>/../../shared/src/$1',
    '^@shared/(.*)$': '<rootDir>/../../shared/src/$1',
  },
};

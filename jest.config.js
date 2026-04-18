module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  setupFilesAfterEnv: ["aws-cdk-lib/testhelpers/jest-autoclean"],
};

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test files location
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.spec.ts'],
    
    // Environment setup
    environment: 'node',
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Coverage thresholds per PRD requirements
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90,
      },
      
      // Include/exclude patterns
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'dist/',
        'bin/',
        '*.config.*',
        'build.mjs',
      ],
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Global setup/teardown
    setupFiles: ['__tests__/setup.ts'],
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
});
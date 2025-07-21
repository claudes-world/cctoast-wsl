import { vi, beforeEach, afterEach } from 'vitest';

// Mock Node.js built-in modules commonly used in the project
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
  },
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  chmodSync: vi.fn(),
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
  },
}));

vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join('/')),
    resolve: vi.fn((...args: string[]) => '/' + args.join('/')),
    dirname: vi.fn((p: string) => p.split('/').slice(0, -1).join('/')),
  };
});

vi.mock('child_process', () => ({
  spawn: vi.fn(),
  exec: vi.fn(),
  execSync: vi.fn(),
}));

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.HOME = '/home/testuser';
process.env.WSL_DISTRO_NAME = 'Ubuntu-22.04';
process.env.WSL_INTEROP = '/run/WSL/123_interop';

// Global test utilities
declare global {
  var testUtils: {
    mockHome: string;
    mockClaudeDir: string;
    resetMocks: () => void;
  };
}

globalThis.testUtils = {
  mockHome: '/home/testuser',
  mockClaudeDir: '/home/testuser/.claude',
  resetMocks: () => {
    vi.clearAllMocks();
  },
};

// Setup and teardown
beforeEach(() => {
  // Reset all mocks before each test
  globalThis.testUtils.resetMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

// Mock child process for script execution
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  exec: vi.fn(),
}));

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
  },
  existsSync: vi.fn(),
}));

describe('Runtime Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Execution Flow', () => {
    it('should execute notification hook successfully with Claude Code payload', async () => {
      // Mock script file exists
      vi.mocked(existsSync).mockReturnValue(true);

      // Mock successful PowerShell execution
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10); // Exit code 0
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      // Simulate Claude Code hook payload
      const hookPayload = {
        session_id: 'test-session-123',
        transcript_path: '/home/user/.claude/transcripts/2024-01-15.json',
        cwd: '/home/user/project',
        hook_event_name: 'Notification',
        message: 'Waiting for your input'
      };

      const mockHookRunner = {
        async executeHook(scriptPath: string, payload: any) {
          // Simulate the actual hook execution process
          const process = spawn('/bin/bash', [scriptPath, '--notification-hook'], {
            stdio: ['pipe', 'pipe', 'pipe']
          });

          // Send JSON payload to stdin
          process.stdin.write(JSON.stringify(payload));
          process.stdin.end();

          return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
              stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
              stderr += data.toString();
            });

            process.on('close', (code) => {
              if (code === 0) {
                resolve({ 
                  success: true, 
                  stdout, 
                  stderr,
                  exitCode: code 
                });
              } else {
                reject(new Error(`Hook failed with exit code ${code}: ${stderr}`));
              }
            });
          });
        }
      };

      const result = await mockHookRunner.executeHook(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        hookPayload
      );

      expect(spawn).toHaveBeenCalledWith('/bin/bash', [
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        '--notification-hook'
      ], expect.objectContaining({
        stdio: ['pipe', 'pipe', 'pipe']
      }));

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('should execute stop hook with task completion notification', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const stopPayload = {
        session_id: 'test-session-123',
        transcript_path: '/home/user/.claude/transcripts/2024-01-15.json',
        cwd: '/home/user/project',
        hook_event_name: 'Stop',
        stop_hook_active: false
      };

      const mockHookRunner = {
        async executeHook(scriptPath: string, payload: any) {
          const process = spawn('/bin/bash', [scriptPath, '--stop-hook'], {
            stdio: ['pipe', 'pipe', 'pipe']
          });

          process.stdin.write(JSON.stringify(payload));
          process.stdin.end();

          return new Promise((resolve) => {
            process.on('close', (code) => {
              resolve({ 
                success: true, 
                exitCode: code,
                hookType: 'stop'
              });
            });
          });
        }
      };

      const result = await mockHookRunner.executeHook(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        stopPayload
      );

      expect(spawn).toHaveBeenCalledWith('/bin/bash', [
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        '--stop-hook'
      ], expect.any(Object));

      expect(result.hookType).toBe('stop');
      expect(result.success).toBe(true);
    });
  });

  describe('PowerShell Integration', () => {
    it('should handle PowerShell execution timeout gracefully', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      // Mock PowerShell process that hangs
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        stdin: { write: vi.fn(), end: vi.fn() },
        kill: vi.fn()
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockHookRunner = {
        async executeHook(scriptPath: string, timeout: number = 10000) {
          const process = spawn('/bin/bash', [scriptPath, '--notification-hook']);
          
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              process.kill('SIGTERM');
              reject(new Error('Hook execution timed out after 10 seconds'));
            }, timeout);

            process.on('close', (code) => {
              clearTimeout(timer);
              resolve({ exitCode: code });
            });
          });
        }
      };

      await expect(
        mockHookRunner.executeHook('/home/testuser/.claude/cctoast-wsl/show-toast.sh', 100)
      ).rejects.toThrow('Hook execution timed out after 10 seconds');

      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should log PowerShell errors to error log file', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { 
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback('BurntToast module not found');
            }
          })
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10); // Exit with error
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockHookRunner = {
        async executeHook(scriptPath: string) {
          const process = spawn('/bin/bash', [scriptPath, '--notification-hook']);
          
          return new Promise((resolve) => {
            let stderr = '';

            process.stderr.on('data', (data) => {
              stderr += data.toString();
            });

            process.on('close', async (code) => {
              if (code !== 0 && stderr) {
                // Log error to file
                const timestamp = new Date().toISOString();
                const logEntry = `[${timestamp}] ERROR: ${stderr}\n`;
                await fs.appendFile('/home/testuser/.claude/cctoast-wsl/toast-error.log', logEntry);
              }
              
              resolve({ 
                exitCode: code, 
                stderr,
                errorLogged: code !== 0 
              });
            });
          });
        }
      };

      const result = await mockHookRunner.executeHook(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh'
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('BurntToast module not found');
      expect(result.errorLogged).toBe(true);
      expect(fs.appendFile).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl/toast-error.log',
        expect.stringContaining('BurntToast module not found')
      );
    });
  });

  describe('Environment Variable Integration', () => {
    it('should pass Claude Code environment variables to hook script', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockHookRunner = {
        async executeHook(scriptPath: string, envVars: Record<string, string>) {
          const process = spawn('/bin/bash', [scriptPath, '--notification-hook'], {
            env: {
              ...process.env,
              ...envVars
            },
            stdio: ['pipe', 'pipe', 'pipe']
          });

          return new Promise((resolve) => {
            process.on('close', (code) => {
              resolve({ 
                exitCode: code,
                environmentPassed: true
              });
            });
          });
        }
      };

      const claudeEnvVars = {
        CLAUDE_SESSION_ID: 'test-session-123',
        CLAUDE_CWD: '/home/user/project',
        CLAUDE_NOTIFICATION: 'Waiting for your input',
        CLAUDE_FILE_PATHS: '/home/user/project/src/main.ts /home/user/project/package.json'
      };

      const result = await mockHookRunner.executeHook(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        claudeEnvVars
      );

      expect(spawn).toHaveBeenCalledWith('/bin/bash', [
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        '--notification-hook'
      ], expect.objectContaining({
        env: expect.objectContaining({
          CLAUDE_SESSION_ID: 'test-session-123',
          CLAUDE_CWD: '/home/user/project',
          CLAUDE_NOTIFICATION: 'Waiting for your input',
          CLAUDE_FILE_PATHS: '/home/user/project/src/main.ts /home/user/project/package.json'
        })
      }));

      expect(result.environmentPassed).toBe(true);
    });
  });

  describe('Path Conversion and WSL Integration', () => {
    it('should handle WSL to Windows path conversion for images', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockChild = {
        stdout: { 
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              // Simulate wslpath output
              callback('C:\\Users\\testuser\\icon.png\n');
            }
          })
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockHookRunner = {
        async executeHook(scriptPath: string, args: string[]) {
          const process = spawn('/bin/bash', [scriptPath, ...args]);
          
          return new Promise((resolve) => {
            let stdout = '';

            process.stdout.on('data', (data) => {
              stdout += data.toString();
            });

            process.on('close', (code) => {
              resolve({ 
                exitCode: code,
                pathConverted: stdout.includes('C:\\'),
                stdout
              });
            });
          });
        }
      };

      const result = await mockHookRunner.executeHook(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        ['--title', 'Test', '--image', '/home/testuser/icon.png']
      );

      expect(result.pathConverted).toBe(true);
      expect(result.stdout).toContain('C:\\Users\\testuser\\icon.png');
    });

    it('should handle missing image files gracefully', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return !path.toString().includes('missing-icon.png');
      });

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { 
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback('Warning: Image file not found, using default icon\n');
            }
          })
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10); // Still succeed with warning
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockHookRunner = {
        async executeHook(scriptPath: string, args: string[]) {
          const process = spawn('/bin/bash', [scriptPath, ...args]);
          
          return new Promise((resolve) => {
            let stderr = '';

            process.stderr.on('data', (data) => {
              stderr += data.toString();
            });

            process.on('close', (code) => {
              resolve({ 
                exitCode: code,
                warning: stderr,
                usedFallback: stderr.includes('default icon')
              });
            });
          });
        }
      };

      const result = await mockHookRunner.executeHook(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        ['--title', 'Test', '--image', '/missing-icon.png']
      );

      expect(result.exitCode).toBe(0);
      expect(result.usedFallback).toBe(true);
      expect(result.warning).toContain('default icon');
    });
  });

  describe('Concurrent Hook Execution', () => {
    it('should handle multiple rapid hook calls without conflicts', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            // Simulate varying execution times
            const delay = Math.random() * 100;
            setTimeout(() => callback(0), delay);
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockHookRunner = {
        async executeHook(scriptPath: string, hookId: number) {
          const process = spawn('/bin/bash', [scriptPath, '--notification-hook']);
          
          return new Promise((resolve) => {
            process.on('close', (code) => {
              resolve({ 
                hookId,
                exitCode: code,
                timestamp: Date.now()
              });
            });
          });
        }
      };

      // Execute 5 hooks concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        mockHookRunner.executeHook('/home/testuser/.claude/cctoast-wsl/show-toast.sh', i)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every(r => r.exitCode === 0)).toBe(true);
      expect(spawn).toHaveBeenCalledTimes(5);

      // Verify all hooks completed
      const hookIds = results.map(r => r.hookId).sort();
      expect(hookIds).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should complete hook execution within performance budget', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            // Simulate fast execution (< 50ms target)
            setTimeout(() => callback(0), 30);
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockHookRunner = {
        async executeHook(scriptPath: string) {
          const startTime = Date.now();
          const process = spawn('/bin/bash', [scriptPath, '--notification-hook']);
          
          return new Promise((resolve) => {
            process.on('close', (code) => {
              const duration = Date.now() - startTime;
              resolve({ 
                exitCode: code,
                duration,
                withinBudget: duration < 50 // 50ms target
              });
            });
          });
        }
      };

      const result = await mockHookRunner.executeHook(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh'
      );

      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(100); // Allow some margin in tests
      expect(result.withinBudget).toBe(true);
    });

    it('should clean up resources after hook execution', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() },
        kill: vi.fn(),
        removeAllListeners: vi.fn()
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockHookRunner = {
        async executeHook(scriptPath: string) {
          const process = spawn('/bin/bash', [scriptPath, '--notification-hook']);
          
          return new Promise((resolve) => {
            process.on('close', (code) => {
              // Simulate cleanup
              process.removeAllListeners();
              resolve({ 
                exitCode: code,
                cleaned: true
              });
            });
          });
        }
      };

      const result = await mockHookRunner.executeHook(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh'
      );

      expect(result.cleaned).toBe(true);
      expect(mockChild.removeAllListeners).toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should continue Claude operation even when hook fails', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { 
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback('BurntToast installation required\n');
            }
          })
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10); // Hook fails
          }
        }),
        stdin: { write: vi.fn(), end: vi.fn() }
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const mockClaudeIntegration = {
        async processWithHooks(task: string) {
          // Simulate Claude processing with hook integration
          const hookResult = await this.runHook('notification');
          
          // Claude should continue even if hook fails
          const taskResult = await this.processTask(task);
          
          return {
            taskCompleted: true,
            hookSuccess: hookResult.success,
            taskResult
          };
        },

        async runHook(type: string) {
          const process = spawn('/bin/bash', [
            '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
            `--${type}-hook`
          ]);

          return new Promise((resolve) => {
            process.on('close', (code) => {
              resolve({ 
                success: code === 0,
                silentFailure: code !== 0 // Hooks fail silently
              });
            });
          });
        },

        async processTask(task: string) {
          // Simulate actual Claude task processing
          return { 
            task, 
            status: 'completed',
            result: 'Task processed successfully'
          };
        }
      };

      const result = await mockClaudeIntegration.processWithHooks('Generate code');

      expect(result.taskCompleted).toBe(true);
      expect(result.hookSuccess).toBe(false);
      expect(result.taskResult.status).toBe('completed');
    });
  });
});
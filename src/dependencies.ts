/**
 * Dependency Management System
 *
 * Verifies WSL environment, PowerShell access, and BurntToast availability.
 * Implementation planned for Milestone 3.
 */

export interface CheckResult {
  name: string;
  passed: boolean;
  fatal: boolean;
  message?: string;
  remedy?: string;
  timestamp: number;
}

export class DependencyChecker {
  async checkAll(): Promise<CheckResult[]> {
    throw new Error('DependencyChecker not implemented yet - Milestone 3');
  }

  async checkBurntToast(): Promise<CheckResult> {
    throw new Error('BurntToast check not implemented yet - Milestone 3');
  }
}

## 1 · Purpose & Scope

Provide a **secure, zero‑admin utility** (`cctoast-wsl`) that lets WSL users trigger native Windows toast notifications—principally for Claude Code's **Notification** and **Stop** hooks—through the PowerShell **BurntToast** module.

### In‑scope

* NPX‑/manual‑installable CLI (global or local) that copies scripts, assets, and patches Claude settings.
* Robust pre‑flight checks (PowerShell, BurntToast, jq).
* Idempotent, atomic JSON merge; optional VCS‑sync suppression.
* Runtime: pure Bash → PowerShell; Node needed only at install time.

### Out‑of‑scope

* Non‑Windows back‑ends, GUI installers, non‑Claude integrations.
* pre-flight checks for WSL, Claude Code.

### Success Metrics

Install completes <30 s; hooks emit toasts in new shell; 90 % test coverage; ≤1 kLOC TS; CI <2 min.

---

## 2 · High‑Level Architecture

1. **Installer CLI (`cctoast-wsl`)** – Node ≥18 binary; parses flags/prompts, verifies deps, copies files, merges JSON.
2. **Bash Script (`show-toast.sh`)** – Direct runtime component; validates WSL, sanitizes input, calls `powershell.exe` (≤10 s timeout).
3. **PowerShell Script** – `Import-Module BurntToast; New-BurntToastNotification …`.
4. **Settings Merger** – JSONC‑aware deep‑merge; duplicates skipped.
5. **Assets** – `claude.png`, future glyphs.

Control flow: Claude Code hook → `~/.claude/cctoast-wsl/show-toast.sh --notification-hook` → PowerShell → toast.

---

## 3 · Deliverables & Repository Layout

```
cctoast-wsl/
├─ bin/               # esbuild‑bundled CLI
├─ scripts/           # show-toast.sh, uninstall.sh, path-helper.sh
├─ src/               # TypeScript sources (≈900 LOC)
├─ fixtures/          # sample settings before/after
├─ __tests__/         # Vitest suites
├─ assets/            # claude.png
├─ docs/              # MANUAL.md, SECURITY.md, FAQ.md, ADVANCED.md, etc.
├─ .github/workflows/ # ci.yml, release.yml
├─ CHANGELOG.md  LICENSE  package.json  tsconfig.json
```

---

## 4 · CLI UX & Flags

| Flag                                 | Default | Description                                 |
| ------------------------------------ | ------- | ------------------------------------------- |
| `--global/-g`                        | ✔       | Install to `~/.claude/…`.                   |
| `--local/-l`                         |         | Install to `.claude/…`.                     |
| `--notification / --no-notification` | on      | Include Notification hook.                  |
| `--stop / --no-stop`                 | on      | Include Stop hook.                          |
| `--sync`                             | off     | When local, modify tracked `settings.json`. |
| `--print-instructions/-p`            |         | Show usage & exit.                          |
| `--json`                             | off     | Machine‑readable summary.                   |
| `--dry-run/-n`                       |         | Preview without writes.                     |
| `--force/-f`                         |         | Bypass failed checks (except BurntToast).   |
| `--quiet/-q`                         |         | Suppress prompts for CI.                    |
| `--uninstall`                        |         | Remove install (scope prompts).             |
| `--version/-v` `--help/-h`           |         | Meta.                                       |

*Defaults*: global + both hooks + no sync.
Exit codes: `0` success · `1` abort · `2` dep‑fail · `3` I/O error.
Interactive flow asks scope → hooks → sync → confirm.

---

## 5 · Dependency Checks

| Check                        | Fatal | Remedy                                                          |
| ---------------------------- | ----- | --------------------------------------------------------------- |
| WSL kernel present           | ✔     | "Run inside WSL."                                               |
| `powershell.exe` in PATH     | ✔     | Add Windows PowerShell to PATH.                                 |
| Execution Policy restrictive | ✖     | Guide to `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| BurntToast module            | ✔     | Offer auto-install via `Install-Module BurntToast -Scope CurrentUser -Force` with user prompt. |
| `jq` binary                  | ✖     | Advise apt/brew or skip jq features.                            |
| Claude dir exists            | ✖     | Warn that hooks won't run until Claude is installed.            |

Results cached in `~/.cache/cctoast-wsl/checks.json` (24 h TTL).

---

## 6 · Hook Installation Logic

* Target file:
  * Global → `~/.claude/settings.json`
  * Local → `.claude/settings.local.json` (or `settings.json` if `--sync`)
* JSONC parsed; for each selected hook: append command if missing:
  *Notification*: `~/.claude/cctoast-wsl/show-toast.sh --notification-hook`
  *Stop*: `~/.claude/cctoast-wsl/show-toast.sh --stop-hook`
* Atomic write (`temp → fsync → rename`); backup saved under `backup/YYYYMMDD‑HHMMSS`.
* `--dry-run` prints unified diff only.

---

## 7 · Bash Script (`show-toast.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
LOG="$HOME/.claude/cctoast-wsl/toast-error.log"
timeout_bin=$(command -v timeout || true)

ps_script=$(cat <<'PS'
param($title,$message,$icon,$log)
try {
  Import-Module BurntToast -ErrorAction Stop
  New-BurntToastNotification -Text $title,$message -AppLogo $icon
} catch {
  $_ | Out-File -Append -FilePath $log
  exit 1
}
PS
)

run() { powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ps_script" \
         -title "$1" -message "$2" -icon "$3" -log "$LOG"; }

title="${1:-Claude Code}"; message="${2:-Waiting for your response}"
icon="${3:-$HOME/.claude/cctoast-wsl/claude.png}"

[[ -n "$timeout_bin" ]] && "$timeout_bin" 10s run "$title" "$message" "$icon" \
  || run "$title" "$message" "$icon" || echo "$(date): toast failed" >> "$LOG"
```

Runtime has no Node dependency.

---

## 8 · Security & Manual‑Install

* **No `postinstall`** in `package.json`; users invoke installer explicitly.
* Git tags + npm provenance; SLSA‑3 attestation.
* All scripts 0o500, user‑level only; refuse to run as root.
* `docs/MANUAL.md` lists SHA‑256 of every runtime file plus `scripts/verify.sh`.
* Manual install: clone → verify → copy scripts/assets → edit hooks by hand.

---

## 9 · Publishing & Versioning

* Scoped name `@claude/cctoast-wsl`.
* Branches: `main` (stable) · `next` (canary).
* GitHub Actions release workflow for semver tag: install → test → build (esbuild) → audit → provenance → `npm publish --provenance`.
* Conventional Commits + `release-please` keep `CHANGELOG.md`.
* SemVer: patch = fixes, minor = additive flags, major = breaking defaults.

---

## 10 · Testing & CI

| Layer         | Tool              | Goal           |
| ------------- | ----------------- | -------------- |
| TS unit       | Vitest            | ≥90 % lines    |
| Merge golden  | Diff test         | 100 %          |
| CLI flags     | C8 branch         | ≥85 %          |
| Shell scripts | Bats‑core         | critical paths |
| Lint          | ESLint + Prettier | 0 warnings     |
| Shell lint    | ShellCheck        | 0 errors       |
| Type          | TSC strict        | clean          |

CI matrix: Ubuntu Node 18/20 + Windows Node 20 (PowerShell smoke test with mocked BurntToast). Coverage sent to Codecov; job fails under targets.

---

## 11 · Documentation & Support

* **README.md** – badges, GIF demo, quick‑start, flags table.
* **docs/MANUAL.md** – manual install, SHA‑256 verify, uninstall.
* **docs/FAQ.md** – top 10 errors with fixes.
* **docs/ADVANCED.md** – custom icons, sounds, localisation.
* **docs/SECURITY.md**, **CONTRIBUTING.md**, **ARCHITECTURE.md**.
* Docs site auto‑built by Docusaurus on GitHub Pages.

---

## 12 · Uninstall & Upgrade

`cctoast-wsl --uninstall [--global|--local] [--yes]`

* Removes installation dir, strips injected commands (leaves hook if others remain), preserves backups.
* Upgrade = re‑run installer; file copy overwrites, JSON merge idempotent.

---

## 13 · Future Enhancements (Backlog)

| Pri | Feature                      | Effort | Notes                           |
| --- | ---------------------------- | ------ | ------------------------------- |
| P1  | Progress toasts              | M      | BurntToast `-UniqueIdentifier`. |
| P1  | User config `~/.cctoastrc`   | S      | Default toast params.           |
| P2  | macOS/Linux native back‑ends | L      | Abstract notifier layer.        |
| P2  | Enhanced BurntToast mgmt     | S      | Version checking, updates.      |
| P3  | VS Code extension            | M      | Surfaced Claude hooks.          |
| P3  | Opt‑in telemetry             | S      | GDPR compliant.                 |
| P4  | GUI installer                | L      | Electron Forge.                 |
| P4  | Multi‑user corporate mode    | L      | Central config server.          |

---

## 14 · Risk & Mitigation

| Risk                                      | Impact             | Likelihood | Mitigation                              |
| ----------------------------------------- | ------------------ | ---------- | --------------------------------------- |
| PS execution policy blocks BurntToast     | No toasts          | M          | Pre‑flight check + guidance.            |
| Script not in PATH (direct calls)         | Hook execution fails | L       | Full path in hook commands.             |
| Merge corrupts settings                   | Claude fails       | L          | Atomic write + backup + dry‑run diff.   |
| WSL/Windows update breaks PowerShell path | Notifications fail | M          | CI nightly check; doc workaround.       |
| npm package hijack                        | Malicious code     | L          | Provenance, signed tags, 2FA.           |
| BurntToast breaking changes               | CLI misfires       | L          | Pin minimum version; CI against latest. |

---

### End‑to‑End Outcome

Developers can run `npx @claude/cctoast-wsl` once and immediately receive desktop toasts whenever Claude Code waits for input or finishes work—all with auditable, minimal, cross‑boundary code that respects security and maintainability best practices.
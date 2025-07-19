please create this project 

we will be creating a bash utility to send toast notifications from inside WSL. we will use the powershell BurntToast module to send the notifications.

> This system depends on having BurntToast installed in powershell on windows.

I want to create an npm package to help users set this up on their machines, using npx.

I would also like a way for users to manually add the hooks by cloning the repo or copying files from the repo (for security reasons).


---

I want to make this package runnable with NPX

either with flags or manual prompting for options. Then print out instructions for how the user can use the tool (also have a flag to print out the instructions)

The user can either set the project up globally or locally (within a project folder).

When setting globally, we create a folder in the user's home directory:

`~/.claude/cctoast-wsl/`

When setting locally, we create a folder in the project root:

`.claude/cctoast-wsl/`

We will give the user the option to add a hook for:
- **Notifications**: Triggered when claude code is waiting for user response for an approval request.
- **Stop**: Triggered when claude code is finished working and is idly waiting for new user input.

Default is to:
 - install globally (recommended)
 - if local install (recommended to not sync the hook, if working with a team or using multiple machines since this is windows-only)
 - install both the notification and stop hooks (recommended)






When installing either hook globally, we update `~/.claude/settings.json` to add the hook. When installing locally, we give the option to sync the hook (not recommended), then either update `.claude/settings.local.json` or `.claude/settings.json` - creating the file if it doesn't exist.

The process of adding the hook is merging a new command into the user's claude code settings.json

Example of a settings.json file with both hooks added:
```json
{
  "cleanupPeriodDays": 150,
  "env": {
    "GH_EMAIL": "claude@claude.do"
  },
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"ccstart - $(date)\" >> cc_user.log"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "cctoast-wsl-notification"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"ccstop - $(date)\" >> cc_user.log"
          },
          {
            "type": "command",
            "command": "cctoast-wsl-stop"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm lint:fix --filter=...{STAGED} 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```


I don't really know how we could create `cctoast-wsl-notification` and `cctoast-wsl-stop` executables or even if that is the best way to do this. I just wrote that as placeholders. Maybe we create a single executable that can be called with a flag to show a notification or stop, like 

```bash
cctoast-wsl --notification-hook # default settings for a notification hook
cctoast-wsl --stop-hook # default settings for a stop hook
cctoast-wsl --help
cctoast-wsl --version
cctoast-wsl --title "Claude Code" --message "Claude Code is waiting for your response" --icon "~/.claude/cctoast-wsl/claude.png" --duration 5000 --sound "default" --attribution "Claude Code" --snoozable
```

or we could also just run a bash script that calls powershell using the command property of the hook, like:

```json
          {
            "type": "command",
            "command": "~/.claude/cctoast-wsl/show-toast.sh"
          }
```

 
> we will need to verify that the user has the powershell in their path.
> need to verify that the user has the jq installed and in their path.
> need to verify that the user has the powershell BurntToast module installed.
> need to verify that the scripts are executable.
> need to verify that the user has the claude code installed.
> after installing the hooks, user needs to restart claude code.

---

anyway, these are just all my initial ideas for what I wanted to create. can you please help me flesh out the full idea (for this **basic** project) and then create a complete project spec?
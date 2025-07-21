I am reviewing the planning docs you made:          │
│   @docs/IMPLEMENTATION_PLAN.md and                    │
│   @docs/ARCHITECTURE.md (based on @docs/PRD.md)       │
│                                                       │
│   I have some questions. Why did you split            │
│   cctoast-wsl CLI -> wrapper executable ->  bash      │
│   shim into 3 parts?                                  │
│                                                       │
│   At it's most basic level, isn't all we are doing    │
│   parting stdin (from the hook) can calling           │
│   powershell.exe to trigger the notification?         │
│                                                       │
│   You can see how I hacked toast notifications to     │
│   work in my current Claude Code hooks by looking at  │
│   @example-claude-settings.json                       │
│                                                       │
│   The purpose of this project is to make this useful  │
│   hook easy to share (and easy for my to setup on     │
│   multiple machines). I have already made a bash      │
│   script that does 75% of the functionality:          │
│   @show-toast.sh                                      │
│                                                       │
│   ---                                                 │
│                                                       │
│   However, I have never made an npm/npx package or    │
│   any open source app, so I do want to look good and  │
│   follow best design practices. Please help teach     │
│   me.                                                 │
│                                                       │
│   ---                                                 │
│                                                       │
│   Also, one other thing I noticed was missing. I      │
│   would like to install BurntToast for the user, if   │
│   they don't already have it installed. Is this       │
│   possible to from inside WSL using `powershell.exe   │
│   -Command ...`?   










please update all of the planning documents. but 
  first, I need help researching all the json shemas
   for all the different claude code hooks, so we 
  can properly parse out the different useful pieces
   that could be captured in a notification (maybe 
  trigger different sounds for different types of 
  notifications (I can think of Notifications for 
  Bash requests, writing/editing files, doing web 
  searches, and calling MCP tools, and stop could 
  all have different toasts, depending on what info 
  we can capture from stdin json passed.

  I've searched pretty hard and can't find complete 
  documentation. Can you help me search for this 
  info? If that fails, I know how we could create a 
  test to figure it out outselves, but that's 
  annoying
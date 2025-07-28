TODO: require pinning to 0.8.5 for AppId to work. and for custom sounds.

```powershell
Install-Module BurntToast -Scope CurrentUser -Force -AllowClobber -RequiredVersion 0.8.5

powershell.exe -NoLogo -NoProfile -Command ' `
  Import-Module BurntToast -RequiredVersion 0.8.5;
  New-BurntToastNotification `
    -AppLogo "\\wsl.localhost\Ubuntu\home\liam\code\cctoast-wsl\assets\claude.png" `
    -HeroImage "\\wsl.localhost\Ubuntu\home\liam\code\cctoast-wsl\assets\claude-thinking.gif" `
    -AppId "com.squirrel.AnthropicClaude.claude" `
    -Header (New-BTHeader -Id 001 -Title "headerrrr") `
    -Text "Claude Test","AppID override test"
'


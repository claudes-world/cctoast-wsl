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

## Summary

Microsoft introduced custom audio for toast notifications on Desktop in Windows 10 Version 1511, but only for Store‑installed UWP apps and only via the **ms-appx:///** and **ms-resource** URI schemes; arbitrary file paths (e.g. `file:///C:/alert.wav`) or HTTP/HTTPS URLs have never been supported for unpackaged Win32 or UWP toasts, and the OS silently drops unsupported audio sources on both Windows 10 and Windows 11 ([Microsoft Learn][1], [Stack Overflow][2]).

## Background: Windows 10 Version 1511

* **Initial support** for custom audio arrived in Windows 10 build 10586 (Version 1511), but if you sent a `<audio>` element to a desktop PC running an earlier build, the toast would simply play no sound ([Microsoft Learn][1]).
* Even on Version 1511, **custom audio only worked** if your app was installed from the Microsoft Store—locally sideloaded or MSI‑deployed toasts remained silent until the Anniversary Update (Version 1607) restored support for sideloaded UWP assets ([Microsoft Learn][1]).

## Current Support on Windows 10 & 11

* **Allowed audio sources** in toast XML are exclusively built‑in sounds (`ms-winsoundevent:`) and packaged app assets (`ms-appx:///` and `ms-resource`) ([Microsoft Learn][1], [Stack Overflow][2]).
* **File paths** (e.g. `C:/Sounds/alert.wav`), **ms-appdata**, and **HTTP/HTTPS URLs** are explicitly **ignored** on both Windows 10 (post‑1607) and Windows 11 ([Microsoft Learn][3]).
* Community scripts like imab.dk’s Windows 11 Toast Notification Script likewise only reference built‑in or packaged audio assets, confirming that local file support has been dropped ([imab.dk][4]).

## Why Microsoft “Removed” the API

Microsoft’s toast platform never officially supported arbitrary local or remote audio URIs for desktop apps, and over successive updates the team tightened the schema to only two URI schemes—**ms-appx:///** and **ms-resource**—to simplify the stack and eliminate potential security or reliability issues with loading external files ([Microsoft Learn][1], [Stack Overflow][2]).

> **Note:** BurntToast v1.x even removed its `-Path`/`-Source` audio flags because the underlying Windows API silently drops file‑based audio sources, so there’s no reliable way to play custom WAV/MP3 files in toasts without packaging your app ([GitHub][5]).

## Suggested In‑App Warning

> **Warning:** Custom audio file paths (e.g. `file:///`, `http://`, `ms-appdata:`) are **not supported** on Windows 10 (Version 1511+) or Windows 11. Only **ms-appx:///** and **ms-resource** schemes—and the built‑in **ms-winsoundevent:** sounds—are honored. See the Microsoft docs for **Custom audio on toasts** for details. Blame Microsoft for breaking your sweet WAV/MP3 alerts! ([Microsoft Learn][1])

**Reference:**
Custom audio on toasts ([Microsoft Learn][1])
How do I add a custom sound to my Windows desktop toast notification? ([Stack Overflow][2])
AddictiveTips: Show a Custom Toast Notification on Windows 10 ([Addictive Tips][6])
Windows 11 Toast Notification Script (imab.dk) ([imab.dk][4])
Windos/BurntToast GitHub – Custom Audio Path Removed ([GitHub][5])

[1]: https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/custom-audio-on-toasts "Custom audio on toasts - Windows apps | Microsoft Learn"
[2]: https://stackoverflow.com/questions/79475920/how-do-i-add-a-custom-sound-to-my-windows-desktop-toast-notification-in-win32-c?utm_source=chatgpt.com "How do I add a custom sound to my Windows desktop toast ..."
[3]: https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/custom-audio-on-toasts?utm_source=chatgpt.com "Custom audio on toasts - Windows apps | Microsoft Learn"
[4]: https://www.imab.dk/windows-10-toast-notification-script/?utm_source=chatgpt.com "Windows 11 Toast Notification Script - imab.dk"
[5]: https://github.com/Windos/BurntToast?utm_source=chatgpt.com "Windos/BurntToast: Module for creating and displaying ... - GitHub"
[6]: https://www.addictivetips.com/windows-tips/show-a-custom-toast-notification-on-windows-10/?utm_source=chatgpt.com "How To Show A Custom Toast Notification On Windows 10"

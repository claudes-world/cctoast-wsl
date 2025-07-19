#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');
const path = require('path');

// Get the directory where this script is located
const scriptDir = __dirname;

program
  .name('wsl-toast')
  .description('Send toast notifications from WSL using PowerShell BurntToast')
  .version('1.0.0');

program
  .command('send')
  .description('Send a toast notification')
  .argument('<message>', 'The message to display in the toast')
  .option('-t, --title <title>', 'Title of the toast notification', 'WSL Notification')
  .option('-i, --icon <icon>', 'Path to icon file (optional)')
  .option('-d, --duration <duration>', 'Duration in seconds (default: 5)', '5')
  .action((message, options) => {
    try {
      // Construct the PowerShell command
      let psCommand = `powershell.exe -Command "New-BurntToastNotification -Text '${message}' -Header '${options.title}' -AppLogo '${options.icon || ''}' -Duration ${options.duration}"`;
      
      // Execute the PowerShell command
      execSync(psCommand, { stdio: 'inherit' });
      console.log('Toast notification sent successfully!');
    } catch (error) {
      console.error('Error sending toast notification:', error.message);
      process.exit(1);
    }
  });

program
  .command('install')
  .description('Install BurntToast module in PowerShell (requires admin privileges)')
  .action(() => {
    try {
      console.log('Installing BurntToast module...');
      const installCommand = `powershell.exe -Command "Install-Module -Name BurntToast -Force -AllowClobber"`;
      execSync(installCommand, { stdio: 'inherit' });
      console.log('BurntToast module installed successfully!');
    } catch (error) {
      console.error('Error installing BurntToast module:', error.message);
      console.log('You may need to run this command with administrator privileges.');
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Check if BurntToast module is installed')
  .action(() => {
    try {
      const checkCommand = `powershell.exe -Command "Get-Module -Name BurntToast -ListAvailable"`;
      execSync(checkCommand, { stdio: 'inherit' });
      console.log('BurntToast module is installed and available.');
    } catch (error) {
      console.log('BurntToast module is not installed. Run "wsl-toast install" to install it.');
    }
  });

program.parse(); 
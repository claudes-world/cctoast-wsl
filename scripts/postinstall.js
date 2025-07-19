const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🎉 WSL Toast utility installed successfully!'));
console.log(chalk.yellow('\n📋 Next steps:'));
console.log(chalk.white('1. Install BurntToast module: wsl-toast install'));
console.log(chalk.white('2. Check installation: wsl-toast check'));
console.log(chalk.white('3. Send a test notification: wsl-toast send "Hello from WSL!"'));
console.log(chalk.gray('\n💡 Note: Installing BurntToast requires administrator privileges on Windows.')); 
// idle-session-detector
/*
This extension watches events from workspace.onDidChangeTextDocument, or
activity on any user-owned pts device.

... and updates $HOME/.vscode-idle with a number of seconds the user has been
idle, in increments of 5s.
*/

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// Set by configuration
let idleNotice;

// Importing required module for file operations
const fs = require('fs').promises;  // Ensure you're using fs.promises
const path = require('path');

// Only do this once
const userId = process.getuid();

// Variables to track idle state and idle time
let userIsActive = false;
  // at the start of each interval, we assume the user is inactive unless
  // an event has made them active.
let secondsIdle = 0;

// Top-level declaration for deactivate
let timer;

// Function to update the idle file with the number of seconds idle
function updateIdleFile() {
  const filePath = path.join(process.env.HOME, '.vscode-idle');
  fs.writeFile(filePath, secondsIdle.toString(), (err) => {
    if (err) {
      vscode.window.showErrorMessage('Failed to update idle file');
    }
  });
}

function incrementAndNotify() {
  secondsIdle += 5;
  if (secondsIdle % idleNotice === 0) {
    const minutesIdle = parseFloat((secondsIdle / 60).toFixed(2));
    vscode.window.showInformationMessage(`Notice: You have been idle for ${minutesIdle} minutes`);
  }
  updateIdleFile();
}

// Function to handle the timer tick every 5 seconds
async function onTimerTick() {  // Mark the function as async
  if (userIsActive) {
    userIsActive = false;
    if (secondsIdle > 0) {
      secondsIdle = 0;
      updateIdleFile();
    }
  } else {
    try {
      // Get a list of files in /dev/pts
      const files = await fs.readdir('/dev/pts');  // Await the readdir call
      let newestTimestamp = 0;

      for (const file of files) {
        const filePath = path.join('/dev/pts', file);
        const stats = await fs.stat(filePath);  // Await the stat call

        // Check if the file is owned by userId and has a newer timestamp
        if (stats.uid === userId && stats.mtimeMs > newestTimestamp) {
          newestTimestamp = stats.mtimeMs;
        }
      }

      const now = Date.now();
      const timeDifference = now - newestTimestamp;

      if (timeDifference < 5019) {  // Check if the newest file was modified within the last ~5 seconds
        secondsIdle = 0;
        updateIdleFile();
      } else {
        incrementAndNotify();
      }
    } catch (err) {
      console.log(`Error while checking /dev/pts: ${err.message}`);
      incrementAndNotify();
    }
  }
}

// This method is called when your extension is activated
function activate(context) {
  // Get configuration vars
  let configuration = vscode.workspace.getConfiguration('idleSessionDetector');
  idleNotice = configuration.get('idleNoticeSeconds');

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('idleSessionDetector')) {
        configuration = vscode.workspace.getConfiguration('idleSessionDetector');
        idleNotice = configuration.get('idleNoticeSeconds');
      }
    })
  );

  // vscode.window.showInformationMessage('Idle session monitor started ...');
  updateIdleFile();
  // Initialize a timer to tick every 5 seconds
  timer = setInterval(onTimerTick, 5000);

  // Ensure the timer is cleared when the extension is deactivated
  context.subscriptions.push({
    dispose: () => {
      clearInterval(timer);
    }
  });

  // Event handler for text document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => userIsActive = true)
  );
}

// This method is called when your extension is deactivated
function deactivate() {
  vscode.window.showInformationMessage('Idle session monitor stopping ...');
  clearInterval(timer);
}

module.exports = {
  activate,
  deactivate
};

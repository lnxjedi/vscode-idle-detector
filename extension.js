// idle-session-detector
/*
This extension watches events from:
* window.onDidChangeTerminalState called with {"interactedWith":true}
* workspace.onDidChangeTextDocument

... and updates $HOME/.vscode-idle with a number of seconds the user has been
idle, in increments of 5s.
*/

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// ... Your existing code above ...

// Importing required module for file operations
const fs = require('fs');
const path = require('path');

// Variables to track idle state and idle time
let userIsActive = false;
  // at the start of each interval, we assume the user is inactive unless
  // an event has made them active.
let secondsIdle = 0;

// Keep this small during development
let idleNotice = 5

// Function to update the idle file with the number of seconds idle
function updateIdleFile() {
  const filePath = path.join(process.env.HOME, '.vscode-idle');
  fs.writeFile(filePath, secondsIdle.toString(), (err) => {
    if (err) {
      vscode.window.showErrorMessage('Failed to update idle file');
    }
  });
}

// Function called when the user becomes active
function userAction() {
  let resetIdleFile = false;
  userIsActive = true;

  if (secondsIdle != 0) {
    resetIdleFile = true;
  }
  secondsIdle = 0;
  if (resetIdleFile) {
    updateIdleFile();
  }
}

function incrementAndNotify() {
  secondsIdle += 5;
  if (secondsIdle % idleNotice === 0) {
    const minutesIdle = (secondsIdle / 60).toFixed(2);
    vscode.window.showInformationMessage(`Notice: You have been idle for ${minutesIdle} minutes`);
  }
  updateIdleFile();
}

// Function to handle the timer tick every 5 seconds
function onTimerTick() {
  if (userIsActive) {
    userIsActive = false;
  } else {
    const filePath = path.join(process.env.HOME, '.vscode-terminal-active');
    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (err.code !== 'ENOENT') {  // If the error is anything other than a missing file
          console.log(`Failed to access ${filePath}: ${err.message}`);
        }
        incrementAndNotify();
      } else {
        const now = Date.now();
        const fileModifiedTime = stats.mtimeMs;
        const timeDifference = now - fileModifiedTime;

        if (timeDifference < 10000) {  // Check if the file was modified within the last 10 seconds
          secondsIdle = 0;
          updateIdleFile();
        } else {
          incrementAndNotify();
        }
      }
    });
  }
}

// This method is called when your extension is activated
function activate(context) {
  vscode.window.showInformationMessage('Idle session monitor started ...');
  updateIdleFile();
  // Initialize a timer to tick every 5 seconds
  const timer = setInterval(onTimerTick, 5000);

  // Event handler for text document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => {
      userAction();
    })
  );

  // Ensure the timer is cleared when the extension is deactivated
  context.subscriptions.push({
    dispose: () => {
      clearInterval(timer);
    }
  });
}

// This method is called when your extension is deactivated
function deactivate() {
  // Nothing to do here for now
}

module.exports = {
  activate,
  deactivate
};

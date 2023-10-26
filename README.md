# idle-session-detector README

The 'idle-session-detector' plugin is meant for use in determining when a remote VSCode server session has become idle.

## Features

* Monitors file editing activity via the VSCode `vscode.workspace.onDidChangeTextDocument` event
* Monitors terminal activity using `/dev/pty/NN` timestamps
* Records seconds idle in `~/.vscode-idle`, +/- 5s

## Requirements

This is mostly only usefuly for VSCode Server running in a container, and you'll need a external process/script to monitor and act on the idle time.

## Extension Settings

This extension contributes the following settings:
* `idleSessionDetector.idleNoticeSeconds`: How often to send `Notice: You have been idle for ${minutesIdle} minutes`

## Dev Notes
* `vsce` is the node module needed to build locally; `npm install -g vsce`; `vsce package`
* `./install-local.sh idle-session-detector-X.Y.Z.vsix` to install

## Known Issues

None.

## Release Notes

### 0.1.0

Initial release

### 0.2.0

Made `idleNoticeSeconds` configurable and defaulted to 30m.

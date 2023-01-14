# Status Messenger

Status Messenger allow you to have messages appear in your VS Code status bar from a remote server.

## Features

Connects to an arbitrary API that passes JSON object with messages, and displays them in the status bar of VS Code. The server is polled every 20 mins.

![In action](./assets/screenshot.png)

Can have an arbitrary number of messages from the same server, with the client chosing which to display at anytime.

![Multiple message variants](./assets/screenshot2.png)

## Requirements

Requires a server and API to be set up to serve JSON files to display. An example implementation can be found [here](https://github.com/pavo-etc/api).

Once you have installed the extension, set up your remote URL by running **Set Remote Message URL**. This will take you through the setup.

![Commands](./assets/commands.png)

## Release Notes

### 1.0.3

 - Update readme

### 1.0.2

- Add license
- Remove extra activation

### 1.0.1

- Add icon

### 1.0.0

Initial release of Status Messenger

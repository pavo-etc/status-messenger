// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import http = require('http');
import https = require('https');

type MessageDto = {
	[key: string]: string
};
let lastUpdate: MessageDto = {};
let remoteURL: string;
let messageVariant: string;
let statusbarItem: vscode.StatusBarItem;
let isVisible: boolean;
let autoupdater: NodeJS.Timer;
let workspaceState: vscode.Memento;

export function activate(context: vscode.ExtensionContext) {
	workspaceState = context.workspaceState;
	remoteURL = workspaceState.get("remoteURL") ?? "";
	messageVariant = workspaceState.get("messageVariant") ?? "";
	isVisible = !!workspaceState.get("isVisible");
	statusbarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

	let updateId = "status-messenger.updateMessage";
	let updateFun = vscode.commands.registerCommand(updateId, () => setMessageVariant(true));

	let setRemoteId = "status-messenger.setRemote";
	let setRemoteFun = vscode.commands.registerCommand(setRemoteId, () => setRemote());


	let hideId = "status-messenger.hideMessage";
	let hideFun = vscode.commands.registerCommand(hideId, () => {
		statusbarItem.hide();
		isVisible = false;
		workspaceState.update("isVisible", isVisible);
		if (autoupdater !== undefined) { clearInterval(autoupdater); }
	});

	statusbarItem.command = updateId;
	context.subscriptions.push(updateFun);

	if (isVisible) {
		autoupdater = setInterval(() => {
			updateStatusBarItem();
		}, 1200000);
		updateStatusBarItem();
	}
}

/**
 * Wrapper around makeRequest, restarts timer if timer has been disabled
 */
function updateStatusBarItem(): void {
	if (!isVisible) {
		autoupdater = setInterval(() => {
			updateStatusBarItem();
		}, 1200000);

		isVisible = true;
		workspaceState.update("isVisible", isVisible);
	}
	makeRequest();
}

/**
 * Make request to remote server. Write result to the statusbar if there if !!pickVariantAfter.
 * Else prompt user to messageVariant. On error it reverts to the previously set message.
 * @param pickVariantAfter Prompt user to choose variant after request succeeds
 */
function makeRequest(pickVariantAfter = false) {
	const httplib = remoteURL.startsWith("https") ? https : http;
	let previousMessage = statusbarItem.text;
	httplib.get(remoteURL, (resp: http.IncomingMessage) => {

		statusbarItem.text = "Updating...";
		statusbarItem.show();

		let data = '';

		resp.on('data', (chunk: any) => {
			data += chunk;
		});

		resp.on('end', () => {
			if (data !== undefined) {
				let payload: MessageDto = JSON.parse(data);
				lastUpdate = payload;
				if (pickVariantAfter) {
					setMessageVariant();
				} else {
					setTimeout(() => {
						statusbarItem.text = payload[messageVariant];
					}, 500);
				}


			} else {
				statusbarItem.text = "No status update!";
				setTimeout(() => {
					statusbarItem.text = previousMessage;
				}, 3000);
			}

		});

	}).on("error", (err: any) => {
		console.log("Error: " + err.message);
		statusbarItem.text = "No status update!";
		setTimeout(() => {
			statusbarItem.text = previousMessage;
		}, 3000);
	});
}

/**
 * Prompt user to set remote URL, save result to workspace state.
 */
async function setRemote() {
	const result = await vscode.window.showInputBox({
		value: remoteURL,
		placeHolder: 'Remote URL: http://example.com/api/status',
		validateInput: text => {
			return isValidHttpUrl(text) ? '' : 'Must enter a valid URL';
		}
	});
	if (!!result) {
		remoteURL = result;
		makeRequest(true);
		workspaceState.update("remoteURL", remoteURL);
	}
}

/**
 * Prompt user to choose a message variant.
 * @param includeRefresh boolean to show the manual refresh option in the prompt
 */
async function setMessageVariant(includeRefresh = false) {
	const options = includeRefresh ? ["Manual Refresh", ...Object.keys(lastUpdate)] : Object.keys(lastUpdate);
	const result = await vscode.window.showQuickPick(options, {
		placeHolder: "Set Message Variant" + (!!messageVariant ? ` (currently: ${messageVariant})` : ""),
	});
	if (!!result) {
		if (result !== "Manual Refresh") {
			messageVariant = result;
			workspaceState.update("messageVariant", messageVariant);

		}
		updateStatusBarItem();
	}
}

/**
 * Validate URL
 * @param testStr
 * @returns boolean true is valid web URL
 */
function isValidHttpUrl(testStr: string) {
	let url;

	try {
		url = new URL(testStr);
	} catch (_) {
		return false;
	}
	return url.protocol === "http:" || url.protocol === "https:";
}
export function deactivate() { }

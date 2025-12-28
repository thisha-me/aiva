/**
 * Aiva - VS Code Theme Extension
 * Copyright (c) 2025 thisha-me
 * Licensed under the MIT License
 * https://github.com/thisha-me/aiva
 */

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	const provider = new AivaViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			AivaViewProvider.viewType,
			provider
		)
	);

	if (vscode.window.activeTextEditor) {
		updateDiagnostics(provider);
	}

	context.subscriptions.push(
		vscode.languages.onDidChangeDiagnostics(() => updateDiagnostics(provider))
	);
}

function updateDiagnostics(provider: AivaViewProvider): void {
	const diagnostics = vscode.languages.getDiagnostics();
	let problems = 0;
	for (const [_doc, collection] of diagnostics) {
		for (const c of collection) {
			if (c.severity === 0 || c.severity === 1) {
				problems++;
			}
		}
	}

	if (problems <= 0) {
		if (!["happy", "default"].includes(provider.pose)) {
			provider.setPose("happy");
			setTimeout(() => {
				provider.setPose("default");
			}, 600);
		} else {
			provider.setPose("default");
		}
	} else if (problems === 1) {
		provider.setPose("sad");
	} else if (problems <= 3) {
		provider.setPose("disappointed");
	} else if (problems <= 6) {
		provider.setPose("shocked");
	} else {
		provider.setPose("cry");
	}
}

class AivaViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "aiva.hello";

	public pose: string = "default";
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Send initial theme
		this.updateTheme();

		// Listen for theme changes
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('workbench.colorTheme')) {
				this.updateTheme();
			}
		});
	}

	public setPose(pose: string) {
		if (this._view) {
			this._view.webview.postMessage({ type: "pose", pose });
			this.pose = pose;
		}
	}

	private updateTheme() {
		if (this._view) {
			const currentTheme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme') || '';
			let themeClass = 'neon'; // default
			if (currentTheme.toLowerCase().includes('mint')) {
				themeClass = 'mint';
			}
			this._view.webview.postMessage({ type: "theme", theme: themeClass });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "out", "aiva-face", "aiva.js")
		);

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "out", "aiva-face", "reset.css")
		);
		const styleVSCodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "out", "aiva-face", "vscode.css")
		);
		const styleMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "out", "aiva-face", "aiva.css")
		);

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Aiva</title>
			</head>
			<body>
				<hey-aiva class="glow">
					<div class="container">
						<div class="body">
						<div class="face">
							<div class="eye" data-shape="circle"></div>
							<div class="mouth" data-shape="half-up"></div>
							<div class="eye" data-shape="circle"></div>
						</div>
						</div>
					</div>
				</hey-aiva>
				<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>`;
	}
}

function getNonce() {
	let text = "";
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
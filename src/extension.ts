
import * as vscode from 'vscode';
import { DebugSession, TerminatedEvent } from "@vscode/debugadapter";
import 'child_process';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	console.log('--- SHELL Debug activated 4 ---');
	vscode.debug.registerDebugAdapterDescriptorFactory("shell", {
		createDebugAdapterDescriptor: (session): vscode.ProviderResult<vscode.DebugAdapterDescriptor> => {
			const config = new SpawnConfig();
			config.command = getProperty(session, "command", "echo");
			config.args = getProperty(session, "args", []);

			return new vscode.DebugAdapterInlineImplementation(new SpawnDebugger(config));
		}
	})
}

export function deactivate() {
	console.log('--- SHELL Debug deactivated 2 ---');
}

function getProperty(session: vscode.DebugSession, property: string, fallbackValue: any) {
	if (session.configuration.hasOwnProperty(property))
		return session.configuration[property];
	return fallbackValue;
}

class SpawnConfig {
	command: string = "";
	args: string[] = [];
}

class SpawnDebugger extends DebugSession {
	constructor(private config: SpawnConfig) {
		super();
	}
	protected launchRequest(): void {
		console.log('launchRequest');

		const proc = spawn(
			this.config.command,
			this.config.args,
		);

		proc.stdout.on('data', (data) => {
			console.log('stdout', Buffer.from(data).toString());
			vscode.debug.activeDebugConsole.append(data);
		});
		proc.stderr.on('data', (data) => {
			console.log('stderr', Buffer.from(data).toString());
			vscode.debug.activeDebugConsole.append(data);
		});

		proc.on('close', () => {
			console.log('close proc');
			this.sendEvent(new TerminatedEvent())
		})
	}
}
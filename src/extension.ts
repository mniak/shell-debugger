
import * as vscode from 'vscode';
import { DebugSession, OutputEvent, TerminatedEvent } from "@vscode/debugadapter";
import 'child_process';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
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
	private proc: ChildProcessWithoutNullStreams | null = null;
	constructor(private config: SpawnConfig) {
		super();

	}
	protected launchRequest(): void {
		this.proc = spawn(
			this.config.command,
			this.config.args,
		);

		this.proc.stdout.on('data', (data) => {
			const dataStr = Buffer.from(data).toString();
			this.sendEvent(new OutputEvent(dataStr, "stdout"));
		});
		this.proc.stderr.on('data', (data) => {
			const dataStr = Buffer.from(data).toString();
			this.sendEvent(new OutputEvent(dataStr, "stderr"));
		});

		this.proc.on('close', () => {
			this.sendEvent(new TerminatedEvent());
		})
	}

	protected terminateRequest(): void {
		if (this.proc) {
			this.proc.kill()
		}
	}
}
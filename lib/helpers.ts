export function isInteractive(): boolean {
	return process.stdout.isTTY && process.stdin.isTTY;
}

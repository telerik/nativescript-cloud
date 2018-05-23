import { parse } from "url";
import * as crypto from "crypto";

const Table = require("cli-table");

export function isInteractive(): boolean {
	return process.stdout.isTTY && process.stdin.isTTY;
}

export function fromWindowsRelativePathToUnix(windowsRelativePath: string): string {
	return windowsRelativePath.replace(/\\/g, "/");
}

export function createTable(headers: string[], data: string[][]): any {
	const table = new Table({
		head: headers,
		chars: { "mid": "", "left-mid": "", "mid-mid": "", "right-mid": "" }
	});

	_.forEach(data, row => table.push(row));
	return table;
}

export function stringifyWithIndentation(data: any, indentation?: string | number): string {
	return JSON.stringify(data, null, indentation || "  ");
}

export function isUrl(data: string): boolean {
	try {
		const u = parse(data);
		return !!(u && u.host);
	} catch (err) {
		return false;
	}
}

export function getHash(str: string, options?: { algorithm?: string, encoding?: crypto.HexBase64Latin1Encoding }): string {
	return crypto.createHash(options && options.algorithm || 'sha256').update(str).digest(options && options.encoding || 'hex');
}

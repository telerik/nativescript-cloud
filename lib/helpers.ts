import { parse } from "url";
import * as randomstring from "randomstring";

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

export function getRandomString(options?: randomstring.GenerateOptions | number): string {
	return randomstring.generate(options);
}

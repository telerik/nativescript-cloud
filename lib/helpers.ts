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

/**
 * Executes all promises and does not stop in case any of them throws.
 * Returns the results of all promises in array when all are successfully resolved.
 * In case any of the promises is rejected, rejects the resulted promise with all accumulated errors.
 * @param {Promise<T>[]} promises Promises to be resolved.
 * @returns {Promise<T[]>} New promise which will be resolved with the results of all promises. //
 */
export function settlePromises<T>(promises: Promise<any>[]): Promise<{result: T, error: Error}[]> {
	return new Promise((resolve, reject) => {
		let settledPromisesCount = 0;
		let results: {result: T, error: Error}[] = [];

		const length = promises.length;

		if (!promises.length) {
			resolve();
		}

		_.forEach(promises, (currentPromise, index) => {
			currentPromise
				.then(result => {
					return { result };
				})
				.catch(error => {
					return { error };
				})
				.then((current: any) => {
					settledPromisesCount++;
					results[index] = current;

					if (settledPromisesCount === length) {
						resolve(results);
					}
				});
		});
	});
}

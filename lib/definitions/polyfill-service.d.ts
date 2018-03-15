/**
 * Describes service used for creating polyfill objects needed for backwards compatibility.
 */
interface IPolyfillService {
	/**
	 * This method tries to resolve a given dependency and if it fails returns the polyfill object passed. Exists purely for backwards compatibility.
	 * @param {string} dependencyName The name of the dependency to resolve.
	 * @param {any} polyfill An object that will be returned in case the dependency cannot be resolved.
	 * @returns {T} The real or polyfilled object.
	 */
	getPolyfillObject<T>(dependencyName: string, polyfill: any): T;
}

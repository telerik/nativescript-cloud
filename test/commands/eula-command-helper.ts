import { EulaCommandHelper } from "../../lib/commands/eula-command-helper";
import { Yok } from "nativescript/lib/common/yok";
import { assert } from "chai";
import { EulaConstants } from "../../lib/constants";
import { EOL } from "os";
const helpers = require("../../lib/helpers");

const originalIsInteractive = helpers.isInteractive;

describe("eulaCommandHelper", () => {
	afterEach(() => {
		helpers.isInteractive = originalIsInteractive;
	});

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("errors", {
			failWithoutHelp: (message: string, ...args: any[]): never => { throw new Error(message); }
		});

		testInjector.register("logger", {
			printMarkdown: (...args: any[]): void => undefined,
			trace: (formatStr?: any, ...args: any[]): void => undefined,
			info: (formatStr?: any, ...args: any[]): void => undefined,
		});

		testInjector.register("nsCloudEulaService", {
			acceptEula: async (): Promise<void> => undefined,
			getEulaDataWithCache: async (): Promise<IEulaData> => ({ url: EulaConstants.eulaUrl, shouldAcceptEula: true })
		});

		testInjector.register("prompter", {
			confirm: async (prompt: string, defaultAction?: () => boolean): Promise<boolean> => true
		});

		return testInjector;
	};

	describe("acceptEula", () => {
		it("prints message containing the URL of the EULA", async () => {
			const testInjector = createTestInjector();
			const $logger = testInjector.resolve<ILogger>("logger");
			const printedMarkdownMessages: string[] = [];
			$logger.printMarkdown = (...args: any[]): void => { printedMarkdownMessages.push(...args); };

			const nsCloudEulaCommandHelper = testInjector.resolve<IEulaCommandHelper>(EulaCommandHelper);
			await nsCloudEulaCommandHelper.acceptEula();
			assert.isTrue(printedMarkdownMessages.join(EOL).indexOf(EulaConstants.eulaUrl) !== -1, "The acceptEula method of nsCloudEulaCommandHelper must print the EULA url.");
		});

		it("calls nsCloudEulaService.acceptEula", async () => {
			const testInjector = createTestInjector();
			const $nsCloudEulaService = testInjector.resolve<IEulaService>("nsCloudEulaService");
			let isAcceptCalled = true;
			$nsCloudEulaService.acceptEula = async (): Promise<void> => { isAcceptCalled = true; };

			const nsCloudEulaCommandHelper = testInjector.resolve<IEulaCommandHelper>(EulaCommandHelper);
			await nsCloudEulaCommandHelper.acceptEula();
			assert.isTrue(isAcceptCalled, "When nsCloudEulaCommandHelper.acceptEula is called, it must call nsCloudEulaService.acceptEula.");
		});
	});

	describe("ensureEulaIsAccepted", () => {
		it("does nothing when EULA is already accepted", async () => {
			const testInjector = createTestInjector();
			const $nsCloudEulaService = testInjector.resolve<IEulaService>("nsCloudEulaService");
			$nsCloudEulaService.getEulaDataWithCache = async (): Promise<IEulaData> => ({ url: EulaConstants.eulaUrl, shouldAcceptEula: false });

			const $logger = testInjector.resolve<ILogger>("logger");
			const loggedMessage: string[] = [];
			$logger.trace = (formatStr?: any, ...args: any[]): void => {
				loggedMessage.push(formatStr);
			};

			const nsCloudEulaCommandHelper = testInjector.resolve<IEulaCommandHelper>(EulaCommandHelper);
			await nsCloudEulaCommandHelper.ensureEulaIsAccepted();
			const expectedMsg = "Ensure EULA accepted: no need to accept EULA - already accepted.";
			assert.include(loggedMessage, expectedMsg);
		});

		it("fails when terminal is not interactive and EULA should be accepted", async () => {
			const testInjector = createTestInjector();
			helpers.isInteractive = () => false;

			const nsCloudEulaCommandHelper = testInjector.resolve<IEulaCommandHelper>(EulaCommandHelper);
			await assert.isRejected(nsCloudEulaCommandHelper.ensureEulaIsAccepted(), "You cannot use cloud services without accepting the EULA.");
		});

		it("fails when terminal is interactive, EULA should be accepted, but user does not accept it", async () => {
			const testInjector = createTestInjector();
			helpers.isInteractive = () => true;
			const $prompter = testInjector.resolve<IPrompter>("prompter");
			$prompter.confirm = async (prompt: string, defaultAction?: () => boolean): Promise<boolean> => false;

			const nsCloudEulaCommandHelper = testInjector.resolve<IEulaCommandHelper>(EulaCommandHelper);
			await assert.isRejected(nsCloudEulaCommandHelper.ensureEulaIsAccepted(), "You cannot use cloud services without accepting the EULA.");
		});

		it("calls nsCloudEulaService.acceptEula when terminal is interactive, EULA should be accept it and user accepts it", async () => {
			const testInjector = createTestInjector();
			helpers.isInteractive = () => true;
			const $nsCloudEulaService = testInjector.resolve<IEulaService>("nsCloudEulaService");
			let isAcceptCalled = true;
			$nsCloudEulaService.acceptEula = async (): Promise<void> => { isAcceptCalled = true; };

			const nsCloudEulaCommandHelper = testInjector.resolve<IEulaCommandHelper>(EulaCommandHelper);
			await nsCloudEulaCommandHelper.ensureEulaIsAccepted();
			assert.isTrue(isAcceptCalled, "When nsCloudEulaCommandHelper.ensureEulaIsAccepted is called and user accepts EULA, a call to nsCloudEulaService.acceptEula is required.");
		});
	});
});

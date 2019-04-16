interface IProcessService {
	listenersCount: number;
	attachToProcessExitSignals(context: any, callback: () => void): void;
}

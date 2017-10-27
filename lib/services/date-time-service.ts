export class DateTimeService implements IDateTimeService {
	public getCurrentEpochTime(): number {
		return new Date().getTime();
	}
}

$injector.register("nsCloudDateTimeService", DateTimeService);

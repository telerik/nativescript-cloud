module.exports = async (data: ICleanupCloudCommunicationChannelData<IWebSocketCloudChannelConfigProperties>) => {
	console.log("data ", JSON.stringify(data));
	const fs = $injector.resolve<IFileSystem>("fs");
	fs.appendFile("D:\\Work\\nativescript-cli\\scratch\\cloud-clean.txt", `\ndata is: ${JSON.stringify(data)}\n\n`);
	
	// const stopMsg: ICloudOperationMessage<ICloudOperationStop> = {
	// 	type: CloudOperationMessageTypes.CLOUD_OPERATION_STOP,
	// 	cloudOperationId: this.cloudOperationId,
	// 	body: {
	// 		code,
	// 		reason
	// 	}
	// };
	// await this.sendMessage<ICloudOperationStop>(stopMsg);
}
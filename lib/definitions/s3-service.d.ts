interface IS3Helper {
    getJsonObjectFromS3File<T>(pathToFile: string): Promise<T>;
    getContentOfS3File(pathToFile: string): Promise<string>;
}

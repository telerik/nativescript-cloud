interface IS3Service {
    getJsonObjectFromS3File<T>(pathToFile: string): Promise<T>;
    getContentOfS3File(pathToFile: string): Promise<string>;
}

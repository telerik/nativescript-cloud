import * as http from "http";
import * as url from "url";
import * as path from "path";
import { CONTENT_TYPES, HTTP_HEADERS, HTTP_STATUS_CODES } from "./constants";

export class HttpServer implements IHttpServer {
	constructor(private $logger: ILogger,
		private $fs: IFileSystem) { }

	public createServer(configuration: IHttpServerConfig): http.Server {
		if (!configuration.catchAll) {
			configuration.catchAll = (request: http.ServerRequest, response: http.ServerResponse) => {
				response.statusCode = 404;
				response.end();
			};
		}

		const server = http.createServer((request: http.ServerRequest, response: http.ServerResponse) => {
			const uriPath = url.parse(request.url).pathname;

			this.$logger.debug("Serving '%s'", uriPath);

			response.setHeader(HTTP_HEADERS.CONNECTION, "close");

			if (!configuration.routes[uriPath]) {
				configuration.catchAll(request, response);
			} else {
				configuration.routes[uriPath](request, response);
			}
		});

		return server;
	}

	public serveFile(fileName: string): (_request: http.ServerRequest, _response: http.ServerResponse) => Promise<void> {
		return (request: http.ServerRequest, response: http.ServerResponse): Promise<void> => {
			return new Promise<void>((resolve, reject) => {
				const mimeTypes: IStringDictionary = {
					".html": CONTENT_TYPES.TEXT_HTML,
					".jpeg": CONTENT_TYPES.IMAGE_JPEG,
					".jpg": CONTENT_TYPES.IMAGE_JPEG,
					".png": CONTENT_TYPES.IMAGE_PNG,
					".js": CONTENT_TYPES.TEXT_JAVASCRIPT,
					".css": CONTENT_TYPES.TEXT_CSS
				};

				this.$logger.debug("Returning '%s'", fileName);

				const mimeType = mimeTypes[path.extname(fileName)];
				response.statusCode = HTTP_STATUS_CODES.SUCCESS;
				response.setHeader(HTTP_HEADERS.CONTENT_TYPE, mimeType);

				this.$fs.createReadStream(fileName).pipe(response);

				response.on("finish", () => {
					resolve();
				});
			});
		};
	}

	public redirect(response: http.ServerResponse, targetUrl: string): void {
		response.statusCode = 302;
		response.setHeader("Location", targetUrl);
		response.end();
	}
}

$injector.register("nsCloudHttpServer", HttpServer);

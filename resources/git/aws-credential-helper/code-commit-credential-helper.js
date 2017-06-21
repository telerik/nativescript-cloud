'use strict';
const aws4 = require('aws4');

const SERVICE = 'codecommit'
const METHOD = 'GIT'

const credentials = {
	accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY,
	sessionToken: process.env.AWS_SESSION_TOKEN,
}

let stdin = ''
process.stdin.on('data', chunk => {
	stdin += chunk.toString();
});

process.stdin.on('end', () => {
	const options = parseParams(stdin);
	writeGitParameters(options)
});

function writeGitParameters(options) {
	let username = credentials.accessKeyId;
	if (credentials.sessionToken) {
		username += `%${credentials.sessionToken}`;
	}

	options.service = SERVICE;
	options.method = METHOD;
	const signer = new aws4.RequestSigner(options, credentials);
	const password = `${signer.getDateTime()}Z${signer.signature()}`

	console.log(`username=${username}`);
	console.log(`password=${password}`);
}

function parseParams(stdin) {
	const params = stdin.split('\n').map(param => param.replace(/\w*=/, ''));
	return {
		protocol: params[0],
		host: params[1],
		path: params[2]
	};
}

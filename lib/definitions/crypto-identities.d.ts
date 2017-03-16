interface IMobileProvisionData {
	AppIDName: string;
	ApplicationIdentifierPrefix: string[];
	CreationDate: Date;
	Platform: string[];
	DeveloperCertificates: Buffer[];
	Entitlements: {
		'keychain-access-groups': string[];
		'get-task-allow': boolean;
		'application-identifier': string;
		'com.apple.developer.ubiquity-kvstore-identifier': string;
		'com.apple.developer.ubiquity-container-identifiers': string;
		'com.apple.developer.team-identifier': string;
	};
	ExpirationDate: Date;
	ProvisionsAllDevices?: boolean;
	Name: string;
	ProvisionedDevices: string[];
	TeamIdentifier: string[];
	TeamName: string;
	TimeToLive: 365;
	UUID: string;
	Version: number;
}

interface ICloudProvisionData {
	SuffixId: string;
	TemplateName: string;
	Identifier: string;
	IsDefault: boolean;
	FileName: string;
	AppGroups: string[];
	Name: string;
}

interface ICertificateInfo {
	pemCert: string;
	organization: string;
	commonName: string;
	friendlyName: string;
	validity: {
		notBefore: Date;
		notAfter: Date;
	};
}

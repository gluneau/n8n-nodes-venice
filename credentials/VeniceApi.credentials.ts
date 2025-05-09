import { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * Venice.ai API Credentials
 * These credentials are used to authenticate with the Venice.ai API
 * using Bearer token authentication
 */
export class VeniceApi implements ICredentialType {
	// Define credential name (used in nodes)
	name = 'veniceApi';

	// Display name in the UI
	displayName = 'Venice.ai API';

	// Link to documentation
	documentationUrl = 'https://docs.venice.ai';

	// Define properties shown in the credentials modal
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Venice.ai API key. You can find this in your Venice.ai dashboard.',
		},
	];

	// Define authentication method (Bearer token)
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}

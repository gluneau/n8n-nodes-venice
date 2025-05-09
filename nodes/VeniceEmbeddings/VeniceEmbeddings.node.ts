import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Venice Embeddings Sub-Node (BETA)
 * This node allows generating vector embeddings from text via Venice.ai's API
 * Note: This feature is currently in BETA and only available to Venice beta testers
 */
export class VeniceEmbeddings implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details
		displayName: 'Venice Embeddings (Beta)',
		name: 'veniceEmbeddings',
		icon: 'file:veniceEmbeddings.svg',
		group: ['transform'],
		version: 1,
		description:
			'Generate vector embeddings from text with Venice.ai (Beta feature, limited access)',
		defaults: {
			name: 'Venice Embeddings',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Embeddings'],
			},
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'veniceApi',
				required: true,
			},
		],
		// Mark this as a sub-node that can be used with the Venice AI root node
		subtitle: 'Venice',
		requestDefaults: {
			baseURL: 'https://api.venice.ai/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// Beta feature notice
			{
				displayName: 'BETA FEATURE - Limited Access',
				name: 'betaNotice',
				type: 'notice',
				default:
					'The Venice Embeddings API is currently in BETA and only available to Venice beta testers. If you encounter authentication errors, you need to contact Venice to request beta access.',
				description: 'This feature requires special beta access permissions',
			},
			// Input type selection
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{
						name: 'Single Text',
						value: 'string',
						description: 'Process a single text string',
					},
					{
						name: 'Multiple Texts',
						value: 'array',
						description: 'Process multiple text strings as an array',
					},
				],
				default: 'string',
				description: 'How to process the input',
			},
			// Single text input
			{
				displayName: 'Text',
				name: 'input',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The text to generate embeddings for',
				required: true,
				displayOptions: {
					show: {
						inputType: ['string'],
					},
				},
			},
			// Multiple text inputs
			{
				displayName: 'Texts',
				name: 'inputs',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: '["text1", "text2", "text3"]',
				description: 'JSON array of texts to generate embeddings for',
				required: true,
				displayOptions: {
					show: {
						inputType: ['array'],
					},
				},
			},
			// Model selection
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'BGE-M3',
						value: 'text-embedding-bge-m3',
					},
				],
				default: 'text-embedding-bge-m3',
				description: 'The model to use for generating embeddings',
			},
			// Options
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Dimensions',
						name: 'dimensions',
						type: 'number',
						default: 1024,
						description: 'The number of dimensions for the output embeddings',
					},
					{
						displayName: 'Encoding Format',
						name: 'encoding_format',
						type: 'options',
						options: [
							{
								name: 'Float',
								value: 'float',
								description: 'Return embeddings as floating point numbers',
							},
							{
								name: 'Base64',
								value: 'base64',
								description: 'Return embeddings as base64-encoded strings',
							},
						],
						default: 'float',
						description: 'The format to return the embeddings in',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const inputType = this.getNodeParameter('inputType', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;

				// Get input based on type
				let input: string | string[];
				if (inputType === 'string') {
					input = this.getNodeParameter('input', i) as string;
				} else {
					// Parse JSON array of texts
					const inputsJson = this.getNodeParameter('inputs', i) as string;
					try {
						input = JSON.parse(inputsJson);
						if (!Array.isArray(input)) {
							throw new NodeOperationError(
								this.getNode(),
								'Input must be a valid JSON array of strings',
								{
									itemIndex: i,
								},
							);
						}
					} catch (error: any) {
						throw new NodeOperationError(
							this.getNode(),
							`Failed to parse inputs as JSON array: ${error.message}`,
							{
								itemIndex: i,
							},
						);
					}
				}

				// Construct request body
				const body: IDataObject = {
					model,
					input,
				};

				// Add optional parameters
				if (options.dimensions !== undefined) body.dimensions = options.dimensions;
				if (options.encoding_format !== undefined) body.encoding_format = options.encoding_format;

				// Make API request
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'veniceApi', {
					method: 'POST',
					url: '/embeddings',
					body,
					json: true,
				});

				// Return embeddings data
				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(response),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error: any) {
				// Check if this is an authentication error (beta access issue)
				if (
					error.message.includes('401') ||
					error.message.toLowerCase().includes('unauthorized') ||
					(error.response && error.response.status === 401)
				) {
					const betaAccessError = new NodeOperationError(
						this.getNode(),
						'Venice Embeddings is a BETA feature and requires special access. Please contact Venice to request beta access for embeddings.',
						{ itemIndex: i },
					);
					if (this.continueOnFail()) {
						returnData.push({
							json: {
								error: betaAccessError.message,
								details: 'You need beta tester access to use embeddings.',
								statusCode: 401,
								isBetaFeature: true,
							},
						});
						continue;
					}
					throw betaAccessError;
				}

				// Handle other errors
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

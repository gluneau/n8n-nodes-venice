import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Venice Chat Model sub-node implementation
 * This node allows creating completions via Venice.ai's chat API
 */
export class VeniceChatModel implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details
		displayName: 'Venice Chat Model',
		name: 'veniceChatModel',
		icon: 'file:veniceChat.svg',
		group: ['transform'],
		version: 1,
		description: 'Generate text completions with Venice.ai models',
		defaults: {
			name: 'Venice Chat',
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
			// Model selection
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'llama-3.3-70b', // Default model from Venice API
				description: 'The model to use for chat completion',
				required: true,
			},
			// Messages collection
			{
				displayName: 'Messages',
				name: 'messages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				placeholder: 'Add Message',
				options: [
					{
						name: 'messagesValues',
						displayName: 'Message',
						values: [
							{
								displayName: 'Role',
								name: 'role',
								type: 'options',
								options: [
									{
										name: 'System',
										value: 'system',
									},
									{
										name: 'User',
										value: 'user',
									},
									{
										name: 'Assistant',
										value: 'assistant',
									},
								],
								default: 'user',
								description: 'The role of the message author',
							},
							{
								displayName: 'Content',
								name: 'content',
								type: 'string',
								typeOptions: {
									rows: 4,
								},
								default: '',
								description: 'The content of the message',
							},
						],
					},
				],
				description: 'The messages to send with the request',
			},
			// Optional parameters
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequency_penalty',
						type: 'number',
						typeOptions: {
							minValue: -2,
							maxValue: 2,
						},
						default: 0,
						description: 'How much to penalize new tokens based on their existing frequency',
					},
					{
						displayName: 'Maximum Completion Tokens',
						name: 'max_completion_tokens',
						type: 'number',
						default: 1024,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Maximum Tokens (Legacy)',
						name: 'max_tokens',
						type: 'number',
						default: 1024,
						description:
							'DEPRECATED: Maximum number of tokens to generate. Use max_completion_tokens instead.',
					},
					{
						displayName: 'Maximum Temperature',
						name: 'max_temp',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 2,
						},
						default: 1.5,
						description: 'Maximum temperature value for dynamic temperature scaling',
					},
					{
						displayName: 'Minimum P',
						name: 'min_p',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
						},
						default: 0.05,
						description: 'Minimum probability threshold for token selection',
					},
					{
						displayName: 'Minimum Temperature',
						name: 'min_temp',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 2,
						},
						default: 0.1,
						description: 'Minimum temperature value for dynamic temperature scaling',
					},
					{
						displayName: 'Number of Completions',
						name: 'n',
						type: 'number',
						default: 1,
						description: 'How many chat completion choices to generate',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presence_penalty',
						type: 'number',
						typeOptions: {
							minValue: -2,
							maxValue: 2,
						},
						default: 0,
						description: 'How much to penalize new tokens based on their presence in text so far',
					},
					{
						displayName: 'Repetition Penalty',
						name: 'repetition_penalty',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 1.0,
						description: 'Parameter for repetition penalty. 1.0 means no penalty.',
					},
					{
						displayName: 'Seed',
						name: 'seed',
						type: 'number',
						default: 42,
						description: 'Random seed for reproducible outputs',
					},
					{
						displayName: 'Stop Sequences',
						name: 'stop',
						type: 'string',
						default: '',
						placeholder: 'String or JSON array',
						description: 'Sequences where the API will stop generating further tokens',
					},
					{
						displayName: 'Stream',
						name: 'stream',
						type: 'boolean',
						default: false,
						description: 'Whether to stream back partial progress',
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 2,
						},
						default: 0.15,
						description: 'Controls randomness: Lower is more deterministic',
					},
					{
						displayName: 'Top K',
						name: 'top_k',
						type: 'number',
						default: 40,
						description: 'Number of highest probability tokens to keep for top-k filtering',
					},
					{
						displayName: 'Top P',
						name: 'top_p',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
						},
						default: 0.9,
						description: 'Controls diversity via nucleus sampling',
					},
					// Venice-specific parameters
					{
						displayName: 'Venice Parameters',
						name: 'veniceParameters',
						type: 'collection',
						placeholder: 'Add Venice Parameter',
						default: {},
						options: [
							{
								displayName: 'Character Slug',
								name: 'character_slug',
								type: 'string',
								default: '',
								description: 'The character slug of a public Venice character',
							},
							{
								displayName: 'Enable Web Search',
								name: 'enable_web_search',
								type: 'options',
								options: [
									{
										name: 'Auto',
										value: 'auto',
									},
									{
										name: 'On',
										value: 'on',
									},
									{
										name: 'Off',
										value: 'off',
									},
								],
								default: 'off',
								description: 'Whether to enable web search for this request',
							},
							{
								displayName: 'Include Venice System Prompt',
								name: 'include_venice_system_prompt',
								type: 'boolean',
								default: true,
								description:
									'Whether to include Venice system prompts alongside specified system prompts',
							},
						],
					},
					{
						displayName: 'Response Format',
						name: 'responseFormat',
						type: 'collection',
						placeholder: 'Add Response Format',
						default: {},
						options: [
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'JSON Object',
										value: 'json_object',
									},
								],
								default: 'json_object',
								description: 'The format in which the response should be returned',
							},
							{
								displayName: 'JSON Schema',
								name: 'json_schema',
								type: 'json',
								default:
									'{\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string"\n    }\n  }\n}',
								description: 'JSON Schema to validate and format the response',
								displayOptions: {
									show: {
										type: ['json_schema'],
									},
								},
							},
						],
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
				// Get main parameters
				const model = this.getNodeParameter('model', i) as string;
				const messagesValues = this.getNodeParameter(
					'messages.messagesValues',
					i,
					[],
				) as IDataObject[];
				const options = this.getNodeParameter('options', i, {}) as IDataObject;

				// Format messages
				const messages = messagesValues.map((message) => ({
					role: message.role as string,
					content: message.content as string,
				}));

				// Construct request body
				const body: IDataObject = {
					model,
					messages,
				};

				// Handle options
				Object.keys(options).forEach((key) => {
					if (key === 'veniceParameters') {
						// Handle Venice-specific parameters
						const veniceParams = options.veniceParameters as IDataObject;
						if (Object.keys(veniceParams).length > 0) {
							body.venice_parameters = {};

							if (veniceParams.character_slug) {
								(body.venice_parameters as IDataObject).character_slug =
									veniceParams.character_slug;
							}

							if (veniceParams.enable_web_search) {
								(body.venice_parameters as IDataObject).enable_web_search =
									veniceParams.enable_web_search;
							}

							if (veniceParams.include_venice_system_prompt !== undefined) {
								(body.venice_parameters as IDataObject).include_venice_system_prompt =
									veniceParams.include_venice_system_prompt;
							}
						}
					} else if (key === 'responseFormat') {
						// Handle response format
						const responseFormat = options.responseFormat as IDataObject;
						if (Object.keys(responseFormat).length > 0) {
							body.response_format = {
								type: responseFormat.type,
							};

							if (responseFormat.type === 'json_schema' && responseFormat.json_schema) {
								try {
									(body.response_format as IDataObject).json_schema = JSON.parse(
										responseFormat.json_schema as string,
									);
								} catch (error: any) {
									throw new NodeOperationError(
										this.getNode(),
										`Invalid JSON Schema: ${error.message}`,
										{
											itemIndex: i,
										},
									);
								}
							}
						}
					} else if (key === 'stop' && options.stop) {
						// Handle stop sequences
						try {
							// Check if it's a JSON array
							if (
								(options.stop as string).trim().startsWith('[') &&
								(options.stop as string).trim().endsWith(']')
							) {
								body.stop = JSON.parse(options.stop as string);
							} else {
								body.stop = options.stop;
							}
						} catch (error) {
							// If parsing fails, use it as a string
							body.stop = options.stop;
						}
					} else {
						// Add all other options directly
						body[key] = options[key];
					}
				});

				// Make API request
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'veniceApi', {
					method: 'POST',
					url: '/chat/completions',
					body,
					json: true,
				});

				// Process and return data
				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(response),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error: any) {
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

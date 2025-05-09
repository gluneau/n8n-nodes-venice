/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionTypes,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { getConnectionHintNoticeField } from '../helpers/utils';
import { ChatVenice } from './VeniceChatModel';
import { makeN8nLlmFailedAttemptHandler } from '../n8nLlmFailedAttemptHandler';
import { N8nLlmTracing } from '../N8nLlmTracing';

/**
 * Venice Chat Model node implementation
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
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'veniceApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.venice.ai/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			getConnectionHintNoticeField([NodeConnectionTypes.AiChain, NodeConnectionTypes.AiAgent]),
			// Model selection
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'llama-3.3-70b', // Default model from Venice API
				description: 'The model to use for chat completion',
				required: true,
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
						name: 'frequencyPenalty',
						type: 'number',
						typeOptions: {
							minValue: -2,
							maxValue: 2,
						},
						default: 0,
						description: 'How much to penalize new tokens based on their existing frequency',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						type: 'number',
						default: 1024,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Maximum Temperature',
						name: 'maxTemp',
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
						name: 'minP',
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
						name: 'minTemp',
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
						name: 'presencePenalty',
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
						name: 'repetitionPenalty',
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
						name: 'topK',
						type: 'number',
						default: 40,
						description: 'Number of highest probability tokens to keep for top-k filtering',
					},
					{
						displayName: 'Top P',
						name: 'topP',
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
								name: 'characterSlug',
								type: 'string',
								default: '',
								description: 'The character slug of a public Venice character',
							},
							{
								displayName: 'Enable Web Search',
								name: 'enableWebSearch',
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
								name: 'includeVeniceSystemPrompt',
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
								name: 'jsonSchema',
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

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('veniceApi');

		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			frequencyPenalty?: number;
			maxTokens?: number;
			maxTemp?: number;
			minP?: number;
			minTemp?: number;
			n?: number;
			presencePenalty?: number;
			repetitionPenalty?: number;
			seed?: number;
			stop?: string;
			temperature?: number;
			topK?: number;
			topP?: number;
			veniceParameters?: {
				characterSlug?: string;
				enableWebSearch?: 'auto' | 'on' | 'off';
				includeVeniceSystemPrompt?: boolean;
			};
			responseFormat?: {
				type?: string;
				jsonSchema?: string;
			};
		};

		// Create the model
		const model = new ChatVenice({
			apiKey: credentials.apiKey as string,
			modelName,
			temperature: options.temperature,
			maxTokens: options.maxTokens,
			topP: options.topP,
			frequencyPenalty: options.frequencyPenalty,
			presencePenalty: options.presencePenalty,
			n: options.n,
			stop: options.stop,
			seed: options.seed,
			// Venice-specific parameters
			repetitionPenalty: options.repetitionPenalty,
			topK: options.topK,
			minP: options.minP,
			maxTemp: options.maxTemp,
			minTemp: options.minTemp,
			veniceParameters: options.veniceParameters,
			responseFormat: options.responseFormat,
			// Add tracing and error handling
			callbacks: [new N8nLlmTracing(this)],
			onFailedAttempt: makeN8nLlmFailedAttemptHandler(this),
		});

		return {
			response: model,
		};
	}
}

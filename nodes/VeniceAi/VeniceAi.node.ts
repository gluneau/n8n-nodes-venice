import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

/**
 * Venice.ai Root Node
 * This serves as the main entry point for Venice.ai integrations
 * and can connect to specialized sub-nodes
 */
export class VeniceAi implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details
		displayName: 'Venice AI',
		name: 'veniceAi',
		icon: 'file:venice.svg',
		group: ['transform'],
		version: 1,
		description: 'Use Venice.ai AI models for text, image, and audio generation',
		defaults: {
			name: 'Venice AI',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
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
		requestDefaults: {
			baseURL: 'https://api.venice.ai/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},

		// Specify that this is a root node that can connect to sub-nodes
		// This makes it operate like a cluster node in n8n
		// subtype: 'root', // Removed unsupported property
		subtitle: 'Connect to Venice.ai models and tools',

		// Input and output definitions
		inputNames: ['Input'],
		outputNames: ['Output'],

		// // Define connections to sub-nodes
		// Removed unsupported 'connections' property
		// connections: [
		// 	{
		// 		node: 'veniceChatModel',
		// 		type: 'ai',
		// 		displayName: 'Add Chat Model',
		// 		description: 'Generate text with Venice.ai chat models',
		// 	},
		// 	{
		// 		node: 'veniceImageGeneration',
		// 		type: 'ai',
		// 		displayName: 'Add Image Generation',
		// 		description: 'Generate and manipulate images',
		// 	},
		// 	{
		// 		node: 'veniceTextToSpeech',
		// 		type: 'ai',
		// 		displayName: 'Add Text to Speech',
		// 		description: 'Convert text to spoken audio',
		// 	},
		// 	{
		// 		node: 'veniceEmbeddings',
		// 		type: 'ai',
		// 		displayName: 'Add Embeddings',
		// 		description: 'Generate vector embeddings from text',
		// 	},
		// ],

		// Properties specific to the root node
		properties: [
			{
				displayName: 'Connection Type',
				name: 'connectionType',
				type: 'options',
				options: [
					{
						name: 'Chat Model',
						value: 'chatModel',
						description: 'Generate text completions with Venice.ai models',
					},
					{
						name: 'Image Generation',
						value: 'imageGeneration',
						description: 'Create and modify images with Venice.ai models',
					},
					{
						name: 'Text to Speech',
						value: 'textToSpeech',
						description: 'Convert text to spoken audio',
					},
					{
						name: 'Embeddings',
						value: 'embeddings',
						description: 'Generate vector embeddings from text',
					},
				],
				default: 'chatModel',
				description: 'The type of Venice.ai service to connect to',
			},
			// API Information - for user reference
			{
				displayName: 'API Reference',
				name: 'apiReference',
				type: 'notice',
				default:
					'Access the <a href="https://docs.venice.ai" target="_blank">Venice.ai API docs</a> for more information.',
			},
		],
	};

	// The root node just passes input data through to sub-nodes
	// The actual processing happens in the sub-nodes
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Simply pass the input data through
		return [this.getInputData()];
	}
}

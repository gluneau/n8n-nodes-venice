import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

/**
 * Venice Image Generation Sub-Node
 * This node allows creating and manipulating images via Venice.ai's API
 */
export class VeniceImageGeneration implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details
		displayName: 'Venice Image Generation',
		name: 'veniceImageGeneration',
		icon: 'file:veniceImage.svg',
		group: ['transform'],
		version: 1,
		description: 'Generate and manipulate images with Venice.ai',
		defaults: {
			name: 'Venice Image',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Image Generation'],
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
			// Operation selection
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Generate',
						value: 'generate',
						description: 'Generate a new image from a text prompt',
						action: 'Generate a new image from a text prompt',
					},
					{
						name: 'Upscale',
						value: 'upscale',
						description: 'Upscale or enhance an existing image',
						action: 'Upscale or enhance an existing image',
					},
				],
				default: 'generate',
			},
			// Parameters for generate operation
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'venice-sd35',
				description: 'The model to use for image generation',
				displayOptions: {
					show: {
						operation: ['generate'],
					},
				},
				required: true,
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'A description of what you want to generate',
				displayOptions: {
					show: {
						operation: ['generate'],
					},
				},
				required: true,
			},
			// Parameters for upscale operation
			{
				displayName: 'Image',
				name: 'image',
				type: 'string',
				default: '',
				description: 'Base64-encoded image to upscale or a URL',
				displayOptions: {
					show: {
						operation: ['upscale'],
					},
				},
				required: true,
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 4,
				},
				default: 2,
				description: 'The scale factor for upscaling (1-4)',
				displayOptions: {
					show: {
						operation: ['upscale'],
					},
				},
			},
			// Options for generate operation
			{
				displayName: 'Generation Options',
				name: 'generationOptions',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['generate'],
					},
				},
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Width',
						name: 'width',
						type: 'number',
						typeOptions: {
							minValue: 64,
							maxValue: 1280,
						},
						default: 1024,
						description: 'Width of the generated image',
					},
					{
						displayName: 'Height',
						name: 'height',
						type: 'number',
						typeOptions: {
							minValue: 64,
							maxValue: 1280,
						},
						default: 1024,
						description: 'Height of the generated image',
					},
					{
						displayName: 'CFG Scale',
						name: 'cfg_scale',
						type: 'number',
						typeOptions: {
							minValue: 0.1,
							maxValue: 20,
						},
						default: 7.5,
						description: 'How strictly the image should adhere to the prompt',
					},
					{
						displayName: 'Format',
						name: 'format',
						type: 'options',
						options: [
							{
								name: 'JPEG',
								value: 'jpeg',
							},
							{
								name: 'PNG',
								value: 'png',
							},
							{
								name: 'WebP',
								value: 'webp',
							},
						],
						default: 'webp',
						description: 'The image format to return',
					},
					{
						displayName: 'Hide Watermark',
						name: 'hide_watermark',
						type: 'boolean',
						default: false,
						description:
							'Whether to hide the Venice watermark (may not be honored for all content)',
					},
					{
						displayName: 'Negative Prompt',
						name: 'negative_prompt',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						description: 'Features to exclude from the image',
					},
					{
						displayName: 'Return Binary',
						name: 'return_binary',
						type: 'boolean',
						default: false,
						description: 'Whether to return binary image data instead of base64',
					},
					{
						displayName: 'Safe Mode',
						name: 'safe_mode',
						type: 'boolean',
						default: true,
						description: 'Whether to blur images classified as having adult content',
					},
					{
						displayName: 'Seed',
						name: 'seed',
						type: 'number',
						default: 0,
						description: 'Random seed for generation (0 for random)',
					},
					{
						displayName: 'Steps',
						name: 'steps',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 30,
						},
						default: 20,
						description: 'Number of diffusion steps (higher = more detailed but slower)',
					},
					{
						displayName: 'Style Preset',
						name: 'style_preset',
						type: 'string',
						default: '',
						description: 'An image style to apply (e.g., "3D Model", "Analog Film", "Anime")',
					},
				],
			},
			// Options for upscale operation
			{
				displayName: 'Upscale Options',
				name: 'upscaleOptions',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['upscale'],
					},
				},
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Enhance',
						name: 'enhance',
						type: 'boolean',
						default: false,
						description: 'Whether to enhance the image during upscaling',
					},
					{
						displayName: 'Enhance Creativity',
						name: 'enhanceCreativity',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
						},
						default: 0.5,
						description: 'How creative the AI should be when enhancing (0-1)',
					},
					{
						displayName: 'Enhance Prompt',
						name: 'enhancePrompt',
						type: 'string',
						default: '',
						description: 'Style to apply during enhancement (e.g., "gold", "marble")',
					},
					{
						displayName: 'Replication',
						name: 'replication',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
						},
						default: 0.35,
						description: 'How strongly lines and noise in the base image are preserved',
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
				const operation = this.getNodeParameter('operation', i) as string;

				// Handle Generate Image operation
				if (operation === 'generate') {
					const model = this.getNodeParameter('model', i) as string;
					const prompt = this.getNodeParameter('prompt', i) as string;
					const options = this.getNodeParameter('generationOptions', i, {}) as IDataObject;

					// Construct request body
					const body: IDataObject = {
						model,
						prompt,
					};

					// Add all options
					Object.assign(body, options);

					// Make API request
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'veniceApi',
						{
							method: 'POST',
							url: '/image/generate',
							body,
							json: true,
							// If returning binary data, handle response accordingly
							encoding: options.return_binary ? 'arraybuffer' : undefined,
							returnFullResponse: options.return_binary ? true : undefined, // Changed to supported property
						},
					);

					if (options.return_binary) {
						// Handle binary response
						const newItem: INodeExecutionData = {
							json: {},
							binary: {},
						};

						// Get headers to determine content type
						const contentType = (response as any).headers['content-type'];
						let fileExtension = 'webp'; // Default extension

						// Determine file extension based on content type or requested format
						if (contentType === 'image/jpeg') fileExtension = 'jpg';
						else if (contentType === 'image/png') fileExtension = 'png';
						else if (options.format) {
							if (options.format === 'jpeg') fileExtension = 'jpg';
							else if (options.format === 'png') fileExtension = 'png';
							else if (options.format === 'webp') fileExtension = 'webp';
						}

						// Create binary data field
						const fileName = `venice_image_${Date.now()}.${fileExtension}`;
						newItem.binary!.data = await this.helpers.prepareBinaryData(
							(response as any).body as Buffer,
							fileName,
							contentType,
						);

						// Add metadata to JSON
						newItem.json = {
							success: true,
							fileName,
							fileExtension,
							contentType,
							size: ((response as any).body as Buffer).length,
						};

						returnData.push(newItem);
					} else {
						// Handle JSON response with base64 data
						returnData.push({ json: response });
					}
				}
				// Handle Upscale Image operation
				else if (operation === 'upscale') {
					const image = this.getNodeParameter('image', i) as string;
					const scale = this.getNodeParameter('scale', i) as number;
					const options = this.getNodeParameter('upscaleOptions', i, {}) as IDataObject;

					// Construct request body
					const body: IDataObject = {
						image,
						scale,
					};

					// Add all options
					Object.assign(body, options);

					// Make API request
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'veniceApi',
						{
							method: 'POST',
							url: '/image/upscale',
							body,
							json: true,
							encoding: 'arraybuffer', // Always returns binary image data
							returnFullResponse: true, // Changed to supported property
						},
					);

					// Handle binary response
					const newItem: INodeExecutionData = {
						json: {},
						binary: {},
					};

					// Get content type from headers
					const contentType = (response as any).headers['content-type'];
					let fileExtension = 'png'; // Default for upscale endpoint

					if (contentType === 'image/jpeg') fileExtension = 'jpg';
					else if (contentType === 'image/webp') fileExtension = 'webp';

					// Create binary data field
					const fileName = `venice_upscaled_${Date.now()}.${fileExtension}`;
					newItem.binary!.data = await this.helpers.prepareBinaryData(
						(response as any).body as Buffer,
						fileName,
						contentType,
					);

					// Add metadata to JSON
					newItem.json = {
						success: true,
						fileName,
						fileExtension,
						contentType,
						size: ((response as any).body as Buffer).length,
						scale,
					};

					returnData.push(newItem);
				}
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

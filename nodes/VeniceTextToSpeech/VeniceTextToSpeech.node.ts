import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

/**
 * Venice Audio Sub-Node
 * This node allows generating speech from text via Venice.ai's API
 */
export class VeniceTextToSpeech implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details
		displayName: 'Venice Text to Speech',
		name: 'veniceTextToSpeech',
		icon: 'file:veniceAudio.svg',
		group: ['transform'],
		version: 1,
		description: 'Convert text to speech with Venice.ai',
		defaults: {
			name: 'Venice Text to Speech',
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
			// Text input
			{
				displayName: 'Text',
				name: 'input',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'Enter text to convert to speech',
				description: 'The text to generate audio for',
				required: true,
			},
			// Model selection
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'tts-kokoro',
						value: 'tts-kokoro',
					},
				],
				default: 'tts-kokoro',
				description: 'The model to use for text-to-speech',
			},
			// Voice selection
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				options: [
					// Alphabetically sorted voices
					{
						name: 'Adam (American Male)',
						value: 'am_adam',
					},
					{
						name: 'Alex (English Male)',
						value: 'em_alex',
					},
					{
						name: 'Alice (British Female)',
						value: 'bf_alice',
					},
					{
						name: 'Alloy (American Female)',
						value: 'af_alloy',
					},
					{
						name: 'Aoede (American Female)',
						value: 'af_aoede',
					},
					{
						name: 'Bella (American Female)',
						value: 'af_bella',
					},
					{
						name: 'Daniel (British Male)',
						value: 'bm_daniel',
					},
					{
						name: 'Dora (English Female)',
						value: 'ef_dora',
					},
					{
						name: 'Echo (American Male)',
						value: 'am_echo',
					},
					{
						name: 'Emma (British Female)',
						value: 'bf_emma',
					},
					{
						name: 'Eric (American Male)',
						value: 'am_eric',
					},
					{
						name: 'Fable (British Male)',
						value: 'bm_fable',
					},
					{
						name: 'Fenrir (American Male)',
						value: 'am_fenrir',
					},
					{
						name: 'George (British Male)',
						value: 'bm_george',
					},
					{
						name: 'Heart (American Female)',
						value: 'af_heart',
					},
					{
						name: 'Jadzia (American Female)',
						value: 'af_jadzia',
					},
					{
						name: 'Jessica (American Female)',
						value: 'af_jessica',
					},
					{
						name: 'Kore (American Female)',
						value: 'af_kore',
					},
					{
						name: 'Lewis (British Male)',
						value: 'bm_lewis',
					},
					{
						name: 'Liam (American Male)',
						value: 'am_liam',
					},
					{
						name: 'Lily (British Female)',
						value: 'bf_lily',
					},
					{
						name: 'Michael (American Male)',
						value: 'am_michael',
					},
					{
						name: 'Nicole (American Female)',
						value: 'af_nicole',
					},
					{
						name: 'Nova (American Female)',
						value: 'af_nova',
					},
					{
						name: 'Onyx (American Male)',
						value: 'am_onyx',
					},
					{
						name: 'Puck (American Male)',
						value: 'am_puck',
					},
					{
						name: 'River (American Female)',
						value: 'af_river',
					},
					{
						name: 'Santa (American Male)',
						value: 'am_santa',
					},
					{
						name: 'Santa (English Male)',
						value: 'em_santa',
					},
					{
						name: 'Sarah (American Female)',
						value: 'af_sarah',
					},
					{
						name: 'Sky (American Female)',
						value: 'af_sky',
					},
				],
				default: 'af_sky',
				description: 'The voice to use when generating the audio',
			},
			// Audio format
			{
				displayName: 'Format',
				name: 'response_format',
				type: 'options',
				options: [
					{
						name: 'AAC',
						value: 'aac',
					},
					{
						name: 'FLAC',
						value: 'flac',
					},
					{
						name: 'MP3',
						value: 'mp3',
					},
					{
						name: 'Opus',
						value: 'opus',
					},
					{
						name: 'PCM',
						value: 'pcm',
					},
					{
						name: 'WAV',
						value: 'wav',
					},
				],
				default: 'mp3',
				description: 'The format of the generated audio',
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
						displayName: 'Speed',
						name: 'speed',
						type: 'number',
						typeOptions: {
							minValue: 0.25,
							maxValue: 4.0,
							numberPrecision: 2,
						},
						default: 1.0,
						description: 'The speed of the generated audio (0.25 to 4.0)',
					},
					{
						displayName: 'Streaming',
						name: 'streaming',
						type: 'boolean',
						default: false,
						description: 'Whether to stream the audio sentence by sentence',
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
				// Get parameters
				const text = this.getNodeParameter('input', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const voice = this.getNodeParameter('voice', i) as string;
				const format = this.getNodeParameter('response_format', i) as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;

				// Construct request body
				const body: IDataObject = {
					input: text,
					model,
					voice,
					response_format: format,
				};

				// Add optional parameters
				if (options.speed !== undefined) body.speed = options.speed;
				if (options.streaming !== undefined) body.streaming = options.streaming;

				// Set content type based on format
				let contentType: string;
				switch (format) {
					case 'mp3':
						contentType = 'audio/mpeg';
						break;
					case 'opus':
						contentType = 'audio/opus';
						break;
					case 'aac':
						contentType = 'audio/aac';
						break;
					case 'flac':
						contentType = 'audio/flac';
						break;
					case 'wav':
						contentType = 'audio/wav';
						break;
					case 'pcm':
						contentType = 'audio/pcm';
						break;
					default:
						contentType = 'audio/mpeg';
				}

				// Make API request
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'veniceApi', {
					method: 'POST',
					url: '/audio/speech',
					body,
					json: true,
					encoding: 'arraybuffer',
					// resolveWithFullResponse: true, // Removed unsupported property
					returnFullResponse: true, // Using supported property instead
				});

				// Create binary data for the audio
				const newItem: INodeExecutionData = {
					json: {
						success: true,
						format,
						contentType,
						text,
						voice,
					},
					binary: {},
				};

				const fileName = `venice_speech_${Date.now()}.${format}`;
				newItem.binary!.data = await this.helpers.prepareBinaryData(
					(response as any).body as Buffer,
					fileName,
					contentType,
				);

				returnData.push(newItem);
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

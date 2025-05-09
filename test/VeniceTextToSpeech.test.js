// Real API test for the VeniceTextToSpeech node
require('dotenv').config();

const { VeniceTextToSpeech } = require('../dist/nodes/VeniceTextToSpeech/VeniceTextToSpeech.node');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Check if API key is available
if (!process.env.VENICE_API_KEY) {
  console.error('Error: VENICE_API_KEY is not set in .env file');
  process.exit(1);
}

// Create a real HTTP request function that uses axios
async function makeRealApiRequest(options) {
  console.log(`Making real API request to: ${options.url}`);
  console.log('Request body:', JSON.stringify(options.body, null, 2));
  
  try {
    const response = await axios({
      method: options.method,
      url: `https://api.venice.ai/api/v1${options.url}`,
      data: options.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`
      },
      responseType: options.encoding === 'arraybuffer' ? 'arraybuffer' : 'json'
    });
    
    console.log('API response status:', response.status);
    
    // For binary responses (audio), save to file for inspection
    if (options.encoding === 'arraybuffer') {
      const buffer = response.data;
      const audioDir = path.join(__dirname, 'output');
      
      // Create output directory if it doesn't exist
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      const contentType = response.headers['content-type'];
      let extension = options.body.response_format || 'mp3';
      
      const filename = path.join(audioDir, `test_audio_${Date.now()}.${extension}`);
      fs.writeFileSync(filename, buffer);
      console.log(`Audio saved to: ${filename}`);
      
      // For binary responses, return a wrapped response similar to n8n's format
      return {
        body: buffer,
        headers: response.headers
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('API request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Mock binary data preparation function
async function prepareBinaryData(buffer, fileName, contentType) {
  return {
    data: buffer,
    mimeType: contentType,
    fileName: fileName,
    fileSize: buffer.length,
  };
}

// Mock the n8n workflow context
const mockContext = {
  getInputData: () => [{ json: {} }],
  getNodeParameter: (param, itemIndex, fallback) => {
    if (param === 'input') return 'This is a test of the Venice text to speech API. The generated audio should sound natural and clear.';
    if (param === 'model') return 'tts-kokoro';
    if (param === 'voice') return 'af_sky'; // American Female Sky voice
    if (param === 'response_format') return 'mp3';
    if (param === 'options') return {
      speed: 1.0,
      streaming: false
    };
    return fallback;
  },
  getCredentials: async () => ({
    apiKey: process.env.VENICE_API_KEY
  }),
  helpers: {
    // Use our real API request function instead of a mock
    httpRequestWithAuthentication: async (auth, options) => {
      return makeRealApiRequest(options);
    },
    prepareBinaryData: prepareBinaryData,
    returnJsonArray: (data) => [{ json: data }],
    constructExecutionMetaData: (data) => data,
  },
  getNode: () => ({ name: 'Venice Text to Speech Test' }),
  continueOnFail: () => false,
};

async function testVeniceTextToSpeech() {
  console.log('Testing VeniceTextToSpeech node with REAL API...');
  
  const node = new VeniceTextToSpeech();
  console.log('Node created:', node.description.displayName);
  
  try {
    // Bind the execute method to our mock context
    const result = await node.execute.call(mockContext);
    console.log('Execution successful!');
    
    // Show useful info about the result but not the full audio data
    if (result[0] && result[0][0]) {
      const data = result[0][0].json;
      console.log('Result metadata:', JSON.stringify(data, null, 2));
      
      if (result[0][0].binary && result[0][0].binary.data) {
        const binaryInfo = {
          mimeType: result[0][0].binary.data.mimeType,
          fileName: result[0][0].binary.data.fileName,
          fileSize: result[0][0].binary.data.fileSize,
        };
        console.log('Binary data info:', JSON.stringify(binaryInfo, null, 2));
      }
    }
    
    return result;
  } catch (error) {
    console.error('Execution failed:', error);
    throw error;
  }
}

// Run the test
testVeniceTextToSpeech()
  .then(() => console.log('Test completed successfully'))
  .catch(error => console.error('Test failed:', error))
  .finally(() => process.exit());

// Real API test for the VeniceImageGeneration node
require('dotenv').config();

const { VeniceImageGeneration } = require('../dist/nodes/VeniceImageGeneration/VeniceImageGeneration.node');
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
    
    // For binary responses, save the image to file for inspection
    if (options.encoding === 'arraybuffer') {
      const buffer = response.data;
      const imgDir = path.join(__dirname, 'output');
      
      // Create output directory if it doesn't exist
      if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
      }
      
      const contentType = response.headers['content-type'];
      let extension = 'webp';
      if (contentType === 'image/jpeg') extension = 'jpg';
      else if (contentType === 'image/png') extension = 'png';
      
      const filename = path.join(imgDir, `test_image_${Date.now()}.${extension}`);
      fs.writeFileSync(filename, buffer);
      console.log(`Image saved to: ${filename}`);
      
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

// Mock the n8n workflow context for image generation
const mockContext = {
  getInputData: () => [{ json: {} }],
  getNodeParameter: (param, itemIndex, fallback) => {
    if (param === 'operation') return 'generate';
    if (param === 'model') return 'venice-sd35';
    if (param === 'prompt') return 'a beautiful sunset over the mountains, photorealistic';
    if (param === 'generationOptions') return {
      width: 1024,
      height: 1024,
      format: 'webp',
      return_binary: true
    };
    if (param === 'image') return '';
    if (param === 'scale') return 2;
    if (param === 'upscaleOptions') return {};
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
  getNode: () => ({ name: 'Venice Image Generation Test' }),
  continueOnFail: () => false,
};

async function testVeniceImageGeneration() {
  console.log('Testing VeniceImageGeneration node with REAL API...');
  
  const node = new VeniceImageGeneration();
  console.log('Node created:', node.description.displayName);
  
  try {
    // Bind the execute method to our mock context
    const result = await node.execute.call(mockContext);
    console.log('Execution successful!');
    console.log('Result (partial):', JSON.stringify(result[0][0].json, null, 2));
    return result;
  } catch (error) {
    console.error('Execution failed:', error);
    throw error;
  }
}

// Run the test
testVeniceImageGeneration()
  .then(() => console.log('Test completed successfully'))
  .catch(error => console.error('Test failed:', error))
  .finally(() => process.exit());

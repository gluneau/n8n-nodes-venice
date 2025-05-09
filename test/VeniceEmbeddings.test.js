// Real API test for the VeniceEmbeddings node
require('dotenv').config();

const { VeniceEmbeddings } = require('../dist/nodes/VeniceEmbeddings/VeniceEmbeddings.node');
const axios = require('axios');

// Check if API key is available and has reasonable length
if (!process.env.VENICE_API_KEY) {
  console.error('Error: VENICE_API_KEY is not set in .env file');
  process.exit(1);
}

// Check the API key length (without revealing the actual key)
console.log(`API Key length: ${process.env.VENICE_API_KEY.length} characters`);
if (process.env.VENICE_API_KEY.length < 30) {
  console.warn('Warning: API key seems too short. Venice API keys are typically longer.');
}

// Create a real HTTP request function that uses axios
async function makeRealApiRequest(options) {
  console.log(`Making real API request to: ${options.url}`);
  console.log('Request body:', JSON.stringify(options.body, null, 2));
  
  const authHeader = `Bearer ${process.env.VENICE_API_KEY}`;
  console.log(`Authorization header length: ${authHeader.length} characters`);
  
  // Construct the full URL
  const fullUrl = `https://api.venice.ai/api/v1${options.url}`;
  console.log(`Full URL: ${fullUrl}`);
  
  try {
    const response = await axios({
      method: options.method,
      url: fullUrl,
      data: options.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    console.log('API response status:', response.status);
    // Log a sample of the vector output (not the full vector as it would be too large)
    if (response.data && response.data.data && response.data.data.length > 0) {
      const sample = response.data.data[0].embedding.slice(0, 5);
      console.log('Sample of embedding vector:', sample, '... (truncated)');
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

// Mock the n8n workflow context
const mockContext = {
  getInputData: () => [{ json: {} }],
  getNodeParameter: (param, itemIndex, fallback) => {
    if (param === 'inputType') return 'string';
    if (param === 'input') return 'Generate a vector embedding for this text to use in semantic search.';
    if (param === 'inputs') return '["text1", "text2"]';
    if (param === 'model') return 'text-embedding-bge-m3';
    if (param === 'options') return {
      dimensions: 1024,
      encoding_format: 'float'
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
    returnJsonArray: (data) => [{ json: data }],
    constructExecutionMetaData: (data) => data,
  },
  getNode: () => ({ name: 'Venice Embeddings Test' }),
  continueOnFail: () => false,
};

async function testVeniceEmbeddings() {
  console.log('Testing VeniceEmbeddings node with REAL API...');
  
  const node = new VeniceEmbeddings();
  console.log('Node created:', node.description.displayName);
  
  try {
    // Bind the execute method to our mock context
    const result = await node.execute.call(mockContext);
    console.log('Execution successful!');
    
    // Show useful info about the result but not the full vector
    if (result[0] && result[0][0] && result[0][0].json) {
      const data = result[0][0].json;
      const summary = {
        model: data.model,
        object: data.object,
        data_count: data.data ? data.data.length : 0,
        embedding_length: data.data && data.data[0] ? data.data[0].embedding.length : 'N/A',
        usage: data.usage
      };
      console.log('Result summary:', JSON.stringify(summary, null, 2));
    }
    
    return result;
  } catch (error) {
    console.error('Execution failed:', error);
    throw error;
  }
}

// Run the test
testVeniceEmbeddings()
  .then(() => console.log('Test completed successfully'))
  .catch(error => console.error('Test failed:', error))
  .finally(() => process.exit());

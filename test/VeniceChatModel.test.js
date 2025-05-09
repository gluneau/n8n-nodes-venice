// Real API test for the VeniceChatModel node
// Load environment variables from .env file
require('dotenv').config();

const { VeniceChatModel } = require('../dist/nodes/VeniceChatModel/VeniceChatModel.node');
const axios = require('axios');

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
      }
    });
    
    console.log('API response status:', response.status);
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
    if (param === 'model') return 'llama-3.3-70b';
    if (param === 'messages.messagesValues') return [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' }
    ];
    if (param === 'options') return {};
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
  getNode: () => ({ name: 'Venice Chat Model Test' }),
  continueOnFail: () => false,
};

async function testVeniceChatModel() {
  console.log('Testing VeniceChatModel node with REAL API...');
  
  const node = new VeniceChatModel();
  console.log('Node created:', node.description.displayName);
  
  try {
    // Bind the execute method to our mock context
    const result = await node.execute.call(mockContext);
    console.log('Execution successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Execution failed:', error);
    throw error;
  }
}

// Run the test
testVeniceChatModel()
  .then(() => console.log('Test completed successfully'))
  .catch(error => console.error('Test failed:', error))
  .finally(() => process.exit());

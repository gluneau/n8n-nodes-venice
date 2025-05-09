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

// Mock the n8n workflow context for supplyData method
const mockSupplyDataContext = {
  getNodeParameter: (param, itemIndex, fallback) => {
    if (param === 'model') return 'llama-3.3-70b';
    if (param === 'options') return {
      temperature: 0.15,
      maxTokens: 1024
    };
    return fallback;
  },
  getCredentials: async () => ({
    apiKey: process.env.VENICE_API_KEY
  }),
};

// Additional mock for testing the model with actual input
async function testModelWithInput(model) {
  const testInput = [
    { _getType: () => 'system', content: 'You are a helpful assistant.' },
    { _getType: () => 'human', content: 'Tell me a short joke about programming.' }
  ];
  
  console.log('Testing model with input...');
  const result = await model._generate(testInput);
  return result;
}

async function testVeniceChatModel() {
  console.log('Testing VeniceChatModel node with REAL API...');
  
  const node = new VeniceChatModel();
  console.log('Node created:', node.description.displayName);
  
  try {
    // 1. Get the model using supplyData
    mockSupplyDataContext.getNode = () => node;
    Object.setPrototypeOf(mockSupplyDataContext, VeniceChatModel.prototype);
    
    console.log('Getting chat model using supplyData...');
    const { response: model } = await node.supplyData.call(mockSupplyDataContext, 0);
    console.log('Model obtained:', model._llmType());
    
    // 2. Test the model with some input
    const result = await testModelWithInput(model);
    console.log('Model test successful!');
    console.log('Generated AI message:', result.generations[0].message.content);
    
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test
testVeniceChatModel()
  .then(() => console.log('Test completed successfully'))
  .catch(error => console.error('Test failed:', error))
  .finally(() => process.exit());

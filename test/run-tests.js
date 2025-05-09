// Test runner for the Venice nodes with real API calls
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Validate environment
if (!process.env.VENICE_API_KEY) {
  console.error('Error: VENICE_API_KEY not found in .env file');
  console.error('Please create a .env file with your Venice API key:');
  console.error('VENICE_API_KEY=your_api_key_here');
  process.exit(1);
}

async function runTests() {
  console.log('Starting Venice nodes tests with REAL API...');
  
  // First, ensure we have a build
  if (!fs.existsSync(path.join(__dirname, '../dist'))) {
    console.error('Error: dist directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  // Run the VeniceChatModel test
  try {
    console.log('\n--- Testing VeniceChatModel with real API ---');
    require('./VeniceChatModel.test');
    
    // Wait 5 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n--- Testing VeniceImageGeneration with real API ---');
    require('./VeniceImageGeneration.test');
    
    // Wait 5 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n--- Testing VeniceEmbeddings with real API ---');
    require('./VeniceEmbeddings.test');
    
    // Wait 5 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n--- Testing VeniceTextToSpeech with real API ---');
    require('./VeniceTextToSpeech.test');
    
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Run all tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});

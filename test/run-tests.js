// Test runner for the Venice nodes  calls
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
  console.log('Starting Venice nodes tests ...');
  
  // First, ensure we have a build
  if (!fs.existsSync(path.join(__dirname, '../dist'))) {
    console.error('Error: dist directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  // Run the VeniceChatModel test
  try {
    console.log('\n--- Testing VeniceChatModel ---');
    require('./VeniceChatModel.test');
    
    // Wait 5 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n--- Testing VeniceImageGeneration ---');
    require('./VeniceImageGeneration.test');
    
    // Wait 5 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n--- Testing VeniceTextToSpeech ---');
    require('./VeniceTextToSpeech.test');

    // Wait 5 seconds between tests
    // await new Promise(resolve => setTimeout(resolve, 5000));
    
    // console.log('\n--- Testing VeniceEmbeddings ---');
    // require('./VeniceEmbeddings.test');
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

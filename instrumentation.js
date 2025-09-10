// JavaScript wrapper to load TypeScript instrumentation
// This allows Node.js --require to work with our TypeScript instrumentation file

// Check if we're in a Node.js environment
if (typeof require !== 'undefined') {
  // Load the TypeScript instrumentation file
  const instrumentation = require('./instrumentation.ts');
  
  // Call the register function if it exists
  if (instrumentation && typeof instrumentation.register === 'function') {
    console.log('🔧 Loading OpenTelemetry instrumentation...');
    instrumentation.register();
  }
}
import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Setup test database or any other global setup
  console.log('Setting up tests...');
});

afterAll(async () => {
  // Cleanup after tests
  console.log('Cleaning up tests...');
});
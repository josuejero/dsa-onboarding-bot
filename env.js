// env.js
import dotenv from 'dotenv';
import { validateEnv } from './config/validation.js';
import { getDefaults } from './config/defaults.js';

// 1. Load .env into process.env
dotenv.config();

// 2. Determine runtime environment
export const NODE_ENV = process.env.NODE_ENV || 'development';

// 3. Validate required env vars at startup
let validatedEnv;
try {
  validatedEnv = validateEnv(process.env);
  console.log('✅ Environment variables validated successfully');
} catch (err) {
  console.error('❌ Environment validation failed:');
  console.error(err.message);
  process.exit(1);
}

// 4. Fetch any defaults based on NODE_ENV
export const defaultConfig = getDefaults(NODE_ENV);

// 5. Export the validated env object
export default validatedEnv;

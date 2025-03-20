// In src/utils/appInitializer.js
import { establishMinimalConnection } from '../lib/supabase';
import databaseSchemaVerifier from './databaseSchemaVerifier';

export const initializeApp = async () => {
  // First establish a minimal connection that avoids problematic tables
  const connectionResult = await establishMinimalConnection();
  
  // Set application mode based on connection result
  const appMode = connectionResult.success ? 
    (connectionResult.mode === 'full-access' ? 'ONLINE' : 'LIMITED') : 
    'OFFLINE';
    
  // Store the app mode for components to reference
  localStorage.setItem('app_mode', appMode);
  
  // Initialize accordingly
  switch (appMode) {
    case 'ONLINE':
      console.log('Application initialized with full database access');
      
      // Verify and repair database schema if necessary
      try {
        const schemaResults = await databaseSchemaVerifier.initialize();
        console.log('Database schema verification completed:', schemaResults);
      } catch (error) {
        console.error('Database schema verification failed:', error);
      }
      break;
      
    case 'LIMITED':
      console.log('Application initialized with limited database access');
      // Disable features that require full access
      
      // Try schema verification with limited functionality
      try {
        await databaseSchemaVerifier.initialize();
      } catch (error) {
        console.warn('Limited schema verification skipped:', error);
      }
      break;
      
    case 'OFFLINE':
      console.log('Application initialized in offline mode');
      // Enable cached data access only
      // Skip schema verification in offline mode
      break;
  }
  
  return { success: true, mode: appMode };
};
// src/utils/connectionManager.js
import { Subject } from 'rxjs';

// Create a centralized connection state manager
const connectionState = {
  isConnected: false,
  connectionAttempts: 0,
  lastError: null,
  connectionSubject: new Subject(),
  
  // Methods to manage state
  setConnected(status, error = null) {
    this.isConnected = status;
    this.lastError = error;
    this.connectionSubject.next({ connected: status, error });
  },
  
  // Subscribe to connection changes
  onConnectionChange(callback) {
    return this.connectionSubject.subscribe(callback);
  }
};

export default connectionState;
/**
 * Compatibility re-exports for the requested VideoService filename.
 * Prefer importing from CallService or streamClientService directly.
 */
export { default } from './CallService';
export { CallService } from './CallService';
export {
  joinDirectCall,
  joinGroupCall,
  prepareIncomingCall,
  ensureVideoClientReady,
} from './streamClientService';
export { endActiveCall, findClientCall } from './callLifecycle';

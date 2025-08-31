// Re-export useAuth from AuthContext to maintain consistent import paths
export { useAuth } from '../contexts/AuthContext';

// Default export for backward compatibility
import { useAuth } from '../contexts/AuthContext';
export default useAuth;

/**
 * Utility functions for consistent date and timestamp handling
 */

/**
 * Ensures that a timestamp string is properly formatted with timezone information.
 * If the timestamp doesn't include timezone info, assumes UTC and adds 'Z'.
 * 
 * @param timestamp - The timestamp string to normalize
 * @returns A properly formatted timestamp string with timezone information
 */
export const normalizeTimestamp = (timestamp: string): string => {
  if (!timestamp) return timestamp;
  
  // If timestamp doesn't include timezone info, assume it's UTC
  let dateString = timestamp;
  if (!timestamp.endsWith('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
    // Check if it has time component
    if (timestamp.includes('T')) {
      // If it has time but no timezone, assume UTC and add Z
      dateString = timestamp + 'Z';
    } else {
      // If it's just a date without time, add UTC indicator
      dateString = timestamp + 'Z';
    }
  }
  
  return dateString;
};

/**
 * Formats a timestamp for display in chat messages
 * 
 * @param timestamp - The timestamp string to format
 * @returns A formatted time string (HH:MM)
 */
export const formatTimestamp = (timestamp: string): string => {
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  const date = new Date(normalizedTimestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a timestamp for display in chat sessions/lists
 * Shows time if within 24 hours, day name if within a week, or date otherwise
 * 
 * @param timestamp - The timestamp string to format
 * @returns A formatted date/time string
 */
export const formatDate = (timestamp: string): string => {
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  const date = new Date(normalizedTimestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

/**
 * Creates a properly formatted UTC timestamp string for new messages
 * 
 * @returns A UTC timestamp string with 'Z' timezone indicator
 */
export const createTimestamp = (): string => {
  return new Date().toISOString();
};

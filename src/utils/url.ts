/**
 * Extracts the hostname from a URL string.
 * Returns an empty string when the URL is invalid.
 */
export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

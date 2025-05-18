/**
 * Calculates delay for exponential backoff with equal jitter.
 * Accepts an options object for flexibility and clarity.
 *
 * @param options - Configuration for backoff calculation
 *   - attempt: The current attempt number (0-based, default: 5)
 *   - baseInterval: The base interval in ms (default: 30000)
 *   - factor: The exponential factor (default: 2)
 *   - maxRetries: Maximum allowed attempts (default: 7)
 * @returns The delay in milliseconds to wait, or -1 if max retries exceeded
 *
 * Why not keep this in the hook? → By extracting, we enable reuse and easier unit testing.
 * Why use an options object? → Named parameters improve readability and extensibility.
 */
export interface CalculateBackoffOptions {
  attempt?: number;
  baseInterval?: number;
  factor?: number;
  maxRetries?: number;
}

export const calculateBackoff = ({
  attempt = 5,
  baseInterval = 30000,
  factor = 2,
  maxRetries = 7,
}: CalculateBackoffOptions = {}): number => {
  if (attempt > maxRetries) {
    return -1; // Maximum retries exceeded
  }

  // Equal jitter - half fixed, half random
  const calculatedDelay = baseInterval * Math.pow(factor, attempt);
  return calculatedDelay / 2 + (Math.random() * calculatedDelay) / 2;
};

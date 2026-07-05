/**
 * Logs messages to the console only in development mode.
 * @param args - The arguments to log.
 */
export const devLog = (...args: unknown[]): void => {
  if (import.meta.env.MODE === 'development') {
    console.log(...args);
  }
};

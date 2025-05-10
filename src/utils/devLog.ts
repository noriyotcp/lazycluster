/**
 * Logs messages to the console only in development mode.
 * @param args - The arguments to log.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const devLog = (...args: any[]): void => {
  if (import.meta.env.MODE === 'development') {
    console.log(...args);
  }
};

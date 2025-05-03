import { useEffect, useRef, useCallback, useState } from 'react';

// Define a generic type for messages if possible, or use a base type
// For now, let's keep it flexible but avoid 'any' directly in the handler signature
// if we know the structure. If not, unknown is safer than any.
// Let's assume a base message structure for now.
interface BaseMessage {
  type: string;
  payload?: unknown; // Use unknown instead of any for better type safety
}

type MessageHandler<T extends BaseMessage> = (message: T) => void;

const RECONNECT_DELAY = 1000; // Reconnect delay in milliseconds

/**
 * Custom hook to manage a persistent connection to the background script.
 * Handles automatic reconnection on disconnect or connection errors.
 *
 * @param portName The name of the port to connect to.
 * @param portName The name of the port to connect to.
 * @param messageHandler A function to handle messages received from the background script.
 * @returns An object containing a function to send messages and the current connection status.
 */
export const useBackgroundConnection = <T extends BaseMessage>(portName: string, messageHandler: MessageHandler<T>) => {
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlerRef = useRef<MessageHandler<T>>(messageHandler);
  const [isConnected, setIsConnected] = useState(false); // Track connection status

  // Keep the message handler ref updated without causing re-renders
  useEffect(() => {
    messageHandlerRef.current = messageHandler;
  }, [messageHandler]);

  const connect = useCallback(() => {
    console.log(`Attempting to connect to background script with port name: ${portName}`);
    try {
      portRef.current = chrome.runtime.connect({ name: portName });

      if (chrome.runtime.lastError) {
        console.error('Connection failed:', chrome.runtime.lastError.message);
        portRef.current = null;
        scheduleReconnect();
        return;
      }

      console.log('Successfully connected to background script.');
      setIsConnected(true); // Update connection status

      portRef.current.onMessage.addListener((message: T) => {
        // Add type annotation
        // Use the ref to ensure the latest handler is called
        messageHandlerRef.current(message);
      });

      portRef.current.onDisconnect.addListener(() => {
        setIsConnected(false); // Update connection status
        console.log('Port disconnected.');
        if (chrome.runtime.lastError) {
          console.error('Disconnect error:', chrome.runtime.lastError.message);
        }
        portRef.current = null;
        scheduleReconnect();
      });
    } catch (error) {
      console.error('Error establishing connection:', error);
      portRef.current = null;
      scheduleReconnect();
    }
  }, [portName]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current); // Clear existing timer if any
    }
    console.log(`Scheduling reconnect in ${RECONNECT_DELAY}ms...`);
    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  }, [connect]);

  const sendMessage = useCallback(
    (message: T) => {
      // Use the generic type T
      if (!portRef.current) {
        console.warn('Cannot send message: Port is not connected.');
        // Optionally, queue the message or attempt to reconnect immediately
        // connect(); // Uncomment to attempt immediate reconnect on send failure
        return;
      }
      try {
        portRef.current.postMessage(message);
      } catch (error) {
        console.error('Error sending message:', error);
        // Handle potential disconnect on send error
        if (error instanceof Error && error.message.includes('disconnected port')) {
          portRef.current = null;
          scheduleReconnect();
        }
      }
    },
    [scheduleReconnect]
  ); // Include scheduleReconnect if attempting immediate reconnect

  useEffect(() => {
    connect(); // Initial connection attempt

    return () => {
      // Cleanup on unmount
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (portRef.current) {
        console.log('Disconnecting port on component unmount.');
        try {
          portRef.current.disconnect();
        } catch (e) {
          // Ignore errors during disconnect on unmount, as the port might already be invalid
          console.warn('Error during disconnect on unmount (ignoring):', e);
        }
        portRef.current = null;
      }
    };
  }, [connect]); // Dependency array includes connect

  return { sendMessage, isConnected }; // Return connection status
};

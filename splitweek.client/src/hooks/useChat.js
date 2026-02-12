import { useState, useEffect, useRef, useCallback } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export function useChat(childId) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const connectionRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !childId) return;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/chat', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveMessage', (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    connection.on('TypingIndicator', ({ userName, isTyping }) => {
      if (isTyping) {
        setTypingUser(userName);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });

    connection.on('MessagesRead', ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((m) => (messageIds.includes(m.id) ? { ...m, isRead: true } : m))
      );
    });

    connection.on('UnreadCountUpdated', () => {
      // This will be handled by NotificationContext
    });

    connection
      .start()
      .then(() => setConnected(true))
      .catch((err) => console.error('SignalR connection failed:', err));

    return () => {
      connection.stop();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [childId]);

  const sendMessage = useCallback(
    async (body, type = 'General', subject = null) => {
      if (!connectionRef.current || !connected) return;
      await connectionRef.current.invoke('SendMessage', childId, body, type, subject);
    },
    [childId, connected]
  );

  const markRead = useCallback(async () => {
    if (!connectionRef.current || !connected) return;
    await connectionRef.current.invoke('MarkMessagesRead', childId);
  }, [childId, connected]);

  const sendTyping = useCallback(
    async (isTyping) => {
      if (!connectionRef.current || !connected) return;
      await connectionRef.current.invoke('SendTypingIndicator', childId, isTyping);
    },
    [childId, connected]
  );

  return { messages, setMessages, connected, typingUser, sendMessage, markRead, sendTyping };
}

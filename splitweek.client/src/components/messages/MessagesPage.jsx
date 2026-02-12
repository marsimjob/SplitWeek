import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Info, Check, CheckCheck, Wifi, WifiOff } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useAuth } from '../../context/AuthContext';
import { messagesApi } from '../../api/messagesApi';
import { useChat } from '../../hooks/useChat';
import { formatDateTime } from '../../utils/dateHelpers';
import EmptyState from '../shared/EmptyState';

const TEMPLATES = [
  { type: 'PickupUpdate', label: 'Pickup Update', prompt: 'Can we adjust the pickup time to...' },
  { type: 'ScheduleChange', label: 'Schedule Change', prompt: 'I need to request a schedule change for...' },
  { type: 'ItemReminder', label: 'Item Reminder', prompt: 'Please remember to pack...' },
];

export default function MessagesPage() {
  const { selectedChild } = useChild();
  const { user } = useAuth();
  const { messages, setMessages, connected, typingUser, sendMessage, markRead, sendTyping } = useChat(selectedChild?.id);
  const [body, setBody] = useState('');
  const [msgType, setMsgType] = useState('FreeText');
  const [loading, setLoading] = useState(true);
  const [showTone, setShowTone] = useState(false);
  const endRef = useRef(null);
  const chatRef = useRef(null);
  const typingRef = useRef(false);

  // Load existing messages on mount
  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    messagesApi.getMessages(selectedChild.id)
      .then((data) => {
        const msgs = data.data || data.messages || data;
        setMessages(Array.isArray(msgs) ? msgs.reverse() : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedChild, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (connected && selectedChild && messages.length > 0) {
      markRead();
    }
  }, [connected, selectedChild, messages.length, markRead]);

  const handleSend = async () => {
    if (!body.trim()) return;
    try {
      await sendMessage(body.trim(), msgType, msgType !== 'FreeText' ? msgType : null);
      setBody('');
      setMsgType('FreeText');
      setShowTone(false);
      sendTyping(false);
      typingRef.current = false;
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setBody(val);
    setShowTone(val.length > 20);

    if (val.length > 0 && !typingRef.current) {
      typingRef.current = true;
      sendTyping(true);
    } else if (val.length === 0 && typingRef.current) {
      typingRef.current = false;
      sendTyping(false);
    }
  }, [sendTyping]);

  const applyTemplate = (template) => {
    setMsgType(template.type);
    setBody(template.prompt);
  };

  if (!selectedChild) return <EmptyState icon={MessageSquare} title="No child profile" description="Select a child to start messaging." />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            <p className="text-sm text-gray-500">About {selectedChild.firstName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <><Wifi size={14} className="text-green-500" /><span className="text-xs text-green-600">Live</span></>
            ) : (
              <><WifiOff size={14} className="text-gray-400" /><span className="text-xs text-gray-400">Connecting...</span></>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages yet" description="Start a conversation about scheduling logistics." />
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {!isMine && (
                      <p className={`text-xs font-medium mb-0.5 ${isMine ? 'text-indigo-200' : 'text-indigo-600'}`}>
                        {msg.senderName}
                      </p>
                    )}
                    {msg.type && msg.type !== 'FreeText' && msg.type !== 'General' && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1 inline-block ${
                        isMine ? 'bg-indigo-500' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {msg.type.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                      <span className={`text-xs ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {formatDateTime(msg.createdAt)}
                      </span>
                      {isMine && (
                        msg.isRead
                          ? <CheckCheck size={14} className="text-indigo-200" />
                          : <Check size={14} className="text-indigo-300" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {typingUser && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">{typingUser} is typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Tone guidance */}
        {showTone && (
          <div className="mx-4 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700">
              <strong>Tone tip:</strong> Focus on your child's needs. Use "I" statements. Keep it factual and logistics-focused.
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2 mb-2 flex-wrap">
            {TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => applyTemplate(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  msgType === t.type
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={body}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
              disabled={!connected}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
            />
            <button
              onClick={handleSend}
              disabled={!connected || !body.trim()}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Info } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useAuth } from '../../context/AuthContext';
import { messagesApi } from '../../api/messagesApi';
import { formatDateTime } from '../../utils/dateHelpers';
import { MESSAGE_TYPES } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';

const TEMPLATES = [
  { type: 'PickupUpdate', label: 'Pickup Update', prompt: 'Can we adjust the pickup time to...' },
  { type: 'ScheduleChange', label: 'Schedule Change', prompt: 'I need to request a schedule change for...' },
  { type: 'ItemReminder', label: 'Item Reminder', prompt: 'Please remember to pack...' },
];

export default function MessagesPage() {
  const { selectedChild } = useChild();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [msgType, setMsgType] = useState('FreeText');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showTone, setShowTone] = useState(false);
  const endRef = useRef(null);

  const loadMessages = async () => {
    if (!selectedChild) return;
    try {
      const data = await messagesApi.getMessages(selectedChild.id);
      setMessages(data.messages || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, [selectedChild]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await messagesApi.sendMessage(selectedChild.id, { type: msgType, body: body.trim() });
      setBody('');
      setMsgType('FreeText');
      loadMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template) => {
    setMsgType(template.type);
    setBody(template.prompt);
  };

  if (!selectedChild) return <EmptyState icon={MessageSquare} title="No child profile" />;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <p className="text-sm text-gray-500">Logistics-only communication about {selectedChild.firstName}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages yet" description="Start a conversation about scheduling logistics." />
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-xl p-3 ${
                    isMine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.type !== 'FreeText' && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1 inline-block ${
                        isMine ? 'bg-indigo-500' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {msg.type}
                      </span>
                    )}
                    <p className="text-sm">{msg.body}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {formatDateTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {showTone && (
          <div className="mx-4 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700">
              <strong>Tone tip:</strong> Focus on your child's needs. Use "I" statements. Keep it factual and logistics-focused.
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2 mb-2 flex-wrap">
            {TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => applyTemplate(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  msgType === t.type ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={body}
              onChange={(e) => { setBody(e.target.value); setShowTone(e.target.value.length > 20); }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || !body.trim()}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

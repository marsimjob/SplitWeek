import { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, History, Download, Check, X, MessageSquare } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { scheduleChangesApi } from '../../api/scheduleChangesApi';
import { formatDateTime } from '../../utils/dateHelpers';
import { downloadCsv, scheduleHistoryToCsv } from '../../utils/exportHelpers';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';

export default function ScheduleChangesPage() {
  const { selectedChild } = useChild();
  const [view, setView] = useState('pending');
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [reason, setReason] = useState('');
  const [originalData, setOriginalData] = useState('');
  const [proposedData, setProposedData] = useState('');

  const loadData = async () => {
    if (!selectedChild) return;
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        scheduleChangesApi.getRequests(selectedChild.id, 'Pending'),
        scheduleChangesApi.getHistory(selectedChild.id),
      ]);
      setPending(p);
      setHistory(h);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedChild]);

  const handleApprove = async (id) => {
    await scheduleChangesApi.approve(id);
    loadData();
  };

  const handleDecline = async (id) => {
    await scheduleChangesApi.decline(id);
    loadData();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await scheduleChangesApi.createRequest(selectedChild.id, { reason, originalData, proposedData });
      setShowCreate(false);
      setReason(''); setOriginalData(''); setProposedData('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const csv = scheduleHistoryToCsv(history);
    downloadCsv(csv, `splitweek-changes-${selectedChild.firstName}.csv`);
  };

  if (!selectedChild) return <EmptyState icon={ArrowLeftRight} title="No child profile" />;
  if (loading) return <LoadingSpinner />;

  const statusColors = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-green-100 text-green-700',
    Declined: 'bg-red-100 text-red-700',
    CounterProposed: 'bg-blue-100 text-blue-700',
    Expired: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button onClick={() => setView('pending')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${view === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            Pending ({pending.length})
          </button>
          <button onClick={() => setView('history')}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${view === 'history' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <History size={16} /> History
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-3 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1">
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">New Schedule Change Request</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Work conflict on Wednesday" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current dates (JSON)</label>
              <textarea value={originalData} onChange={(e) => setOriginalData(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={2}
                placeholder='[{"date":"2026-02-18","assignedParentId":1}]' />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposed dates (JSON)</label>
              <textarea value={proposedData} onChange={(e) => setProposedData(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={2}
                placeholder='[{"date":"2026-02-18","assignedParentId":2}]' />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Submit Request</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {view === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title="No pending requests" description="All schedule change requests have been resolved." />
          ) : (
            pending.map((req) => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">Request from {req.requestedByName}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusColors[req.status]}`}>{req.status}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDateTime(req.createdAt)}</span>
                </div>
                {req.reason && <p className="text-sm text-gray-600 mb-3">{req.reason}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-1">
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => handleDecline(req.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-1">
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <EmptyState icon={History} title="No history yet" />
          ) : (
            history.map((req) => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{req.requestedByName}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusColors[req.status]}`}>{req.status}</span>
                  {req.reason && <p className="text-sm text-gray-500 mt-1">{req.reason}</p>}
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(req.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { UserCircle, Heart, Pill, Activity, Clock, Plus, Copy, Check } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useChild } from '../../context/ChildContext';
import { childrenApi } from '../../api/childrenApi';
import { routinesApi } from '../../api/routinesApi';
import { medicationsApi } from '../../api/medicationsApi';
import { activitiesApi } from '../../api/activitiesApi';
import { ROUTINE_TYPES, DAY_NAMES } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function ChildProfilePage() {
  const { childId } = useParams();
  const { selectedChild, refreshChildren } = useChild();
  const [child, setChild] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [medications, setMedications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCreateChild, setShowCreateChild] = useState(false);
  const [newChild, setNewChild] = useState({ firstName: '', lastName: '', dateOfBirth: '', allergies: '' });

  const id = childId || selectedChild?.id;

  const loadData = async () => {
    if (!id) { setLoading(false); return; }
    try {
      const [c, r, m, a] = await Promise.all([
        childrenApi.getChild(id),
        routinesApi.getRoutines(id),
        medicationsApi.getMedications(id),
        activitiesApi.getActivities(id),
      ]);
      setChild(c);
      setRoutines(r);
      setMedications(m);
      setActivities(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleCreateChild = async (e) => {
    e.preventDefault();
    try {
      await childrenApi.createChild(newChild);
      await refreshChildren();
      setShowCreateChild(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async () => {
    try {
      const data = await childrenApi.createInvite(id);
      setInviteLink(`${window.location.origin}/invite/${data.token}`);
    } catch (err) {
      console.error(err);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner />;

  if (!id || !child) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <UserCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Child Profile</h2>
          <p className="text-sm text-gray-500 mb-4">Create a child profile to start using Split Week.</p>
          {!showCreateChild ? (
            <button onClick={() => setShowCreateChild(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700">
              <Plus size={18} className="inline mr-2" /> Create Child Profile
            </button>
          ) : (
            <form onSubmit={handleCreateChild} className="text-left space-y-3 mt-4">
              <input type="text" placeholder="First Name" required value={newChild.firstName}
                onChange={(e) => setNewChild({ ...newChild, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Last Name" required value={newChild.lastName}
                onChange={(e) => setNewChild({ ...newChild, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
              <input type="date" placeholder="Date of Birth" value={newChild.dateOfBirth}
                onChange={(e) => setNewChild({ ...newChild, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Allergies (optional)" value={newChild.allergies}
                onChange={(e) => setNewChild({ ...newChild, allergies: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium">Create</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'info', label: 'Info', icon: UserCircle },
    { key: 'routines', label: 'Routines', icon: Clock },
    { key: 'medications', label: 'Medications', icon: Pill },
    { key: 'activities', label: 'Activities', icon: Activity },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <UserCircle size={36} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{child.firstName} {child.lastName}</h1>
            {child.dateOfBirth && <p className="text-sm text-gray-500">Born: {child.dateOfBirth}</p>}
            <div className="flex gap-2 mt-1">
              {child.parentAName && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Parent A: {child.parentAName}</span>}
              {child.parentBName && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Parent B: {child.parentBName}</span>}
            </div>
          </div>
        </div>

        {!child.parentBName && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 mb-2">Invite the other parent to join this schedule.</p>
            {inviteLink ? (
              <div className="flex gap-2">
                <input value={inviteLink} readOnly className="flex-1 px-3 py-1.5 bg-white border rounded text-xs" />
                <button onClick={copyLink} className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ) : (
              <button onClick={handleInvite} className="text-sm bg-amber-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-amber-700">
                Generate Invite Link
              </button>
            )}
          </div>
        )}
      </div>

      {child.allergies && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-red-800 flex items-center gap-2 mb-1"><Heart size={16} /> Allergies</h3>
          <p className="text-sm text-red-700">{child.allergies}</p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
              tab === key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {tab === 'info' && (
          <div className="space-y-4">
            {child.medicalNotes && <div><h4 className="font-medium text-gray-700 mb-1">Medical Notes</h4><p className="text-sm text-gray-600">{child.medicalNotes}</p></div>}
            {child.emergencyContact1Name && (
              <div><h4 className="font-medium text-gray-700 mb-1">Emergency Contact 1</h4>
                <p className="text-sm text-gray-600">{child.emergencyContact1Name} &mdash; {child.emergencyContact1Phone}</p></div>
            )}
            {child.emergencyContact2Name && (
              <div><h4 className="font-medium text-gray-700 mb-1">Emergency Contact 2</h4>
                <p className="text-sm text-gray-600">{child.emergencyContact2Name} &mdash; {child.emergencyContact2Phone}</p></div>
            )}
          </div>
        )}

        {tab === 'routines' && (
          <div className="space-y-3">
            {Object.entries(ROUTINE_TYPES).map(([key, label]) => {
              const routineItems = routines.filter((r) => r.routineType === key);
              if (routineItems.length === 0) return null;
              return (
                <div key={key}>
                  <h4 className="font-medium text-gray-700 mb-2">{label}</h4>
                  {routineItems.map((r) => (
                    <div key={r.id} className="p-3 bg-gray-50 rounded-lg mb-1">
                      <div className="text-sm text-gray-900">{r.description}</div>
                      {r.timeOfDay && <div className="text-xs text-gray-500 mt-0.5">{r.timeOfDay}</div>}
                    </div>
                  ))}
                </div>
              );
            })}
            {routines.length === 0 && <p className="text-sm text-gray-500">No routines added yet.</p>}
          </div>
        )}

        {tab === 'medications' && (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{med.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${med.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {med.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{med.dosage} &mdash; {med.frequency}</p>
                {med.instructions && <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>}
              </div>
            ))}
            {medications.length === 0 && <p className="text-sm text-gray-500">No medications tracked.</p>}
          </div>
        )}

        {tab === 'activities' && (
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                <Activity size={18} className="text-indigo-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{act.name}</div>
                  <div className="text-sm text-gray-600">
                    {act.dayOfWeek != null ? DAY_NAMES[act.dayOfWeek] : 'Varies'}
                    {act.startTime && ` at ${act.startTime}`}
                    {act.location && ` — ${act.location}`}
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-gray-500">No activities added yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { childrenApi } from '../../api/childrenApi';

export default function InviteAcceptPage() {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const accept = async () => {
      try {
        await childrenApi.acceptInvite(token);
        setStatus('success');
        setTimeout(() => navigate('/calendar'), 2000);
      } catch (err) {
        setError(err.message || 'Invalid or expired invite link');
        setStatus('error');
      }
    };

    accept();
  }, [isAuthenticated, token, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="bg-indigo-600 p-3 rounded-xl inline-block mb-4">
            <Users className="text-white" size={28} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">You've been invited to Split Week</h2>
          <p className="text-gray-600 mb-6">Please sign in or create an account to accept this invitation.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
              Sign In
            </Link>
            <Link to="/register" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        {status === 'pending' && <p className="text-gray-600">Accepting invitation...</p>}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Accepted!</h2>
            <p className="text-gray-600">Redirecting to calendar...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link to="/calendar" className="text-indigo-600 font-medium hover:text-indigo-700">
              Go to Calendar
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

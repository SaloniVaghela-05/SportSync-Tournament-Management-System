import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const FunctionCallPage: React.FC = () => {
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('Please enter a player ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/function/player-team-college/${playerId}`);
      setResult(response.data);
    } catch (err: any) {
      console.error('Error calling function:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || 'Failed to fetch player team and college information';
      setError(errorMessage);
      
      if (err.response?.data) {
        setResult({ sql_error: err.response.data.sql_error, solution: err.response.data.solution, hint: err.response.data.hint });
      }
      if (err.response?.data?.details && err.response.data.details.includes('does not exist')) {
        console.error('Function does not exist. Please create it using FUNCTION_FIX.sql');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl font-bold text-gray-800">
            Player Team & College Function
          </h1>
          <p className="text-gray-600 mt-2">
            Q36: Get current team and college for a player using PostgreSQL function
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player ID
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="Enter Player ID"
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Fetching...' : 'Fetch Data'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 border border-red-300 rounded-lg p-4 mb-6">
            <div className="font-semibold mb-2">Error:</div>
            <div className="mb-2">{error}</div>
            {result?.sql_error && (
              <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                <div className="text-sm font-medium mb-1">Database Error:</div>
                <div className="text-xs font-mono">{result.sql_error}</div>
                {result.solution && (
                  <div className="mt-2 text-sm">
                    <strong>Solution:</strong> {result.solution}
                  </div>
                )}
                {result.hint && (
                  <div className="mt-2 text-sm">
                    <strong>Hint:</strong> {result.hint}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {result && !error && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Function Result
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Query:</strong> {result.query}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Description:</strong> {result.description}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Player ID:</strong> {result.player_id}
              </div>
            </div>

            {result.data && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  {Object.entries(result.data).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </div>
                      <div className="text-lg font-semibold text-gray-800">
                        {value !== null && value !== undefined ? String(value) : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            About This Function
          </h3>
          <p className="text-gray-600 text-sm">
            This endpoint calls the PostgreSQL function <code className="bg-gray-100 px-2 py-1 rounded">get_player_current_team_info(p_player_id)</code> which returns the current team name and college name for a given player ID.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FunctionCallPage;


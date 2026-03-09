import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface TournamentFormData {
  tournament_id: string;
  tournament_year: number | string;
  season: string;
  start_date: string;
  end_date: string;
}

const TournamentInsertPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TournamentFormData>({
    tournament_id: '',
    tournament_year: '',
    season: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tournamentIdError, setTournamentIdError] = useState<string>('');
  const [checkingTournamentId, setCheckingTournamentId] = useState(false);

  const checkTournamentId = async (tournamentId: string) => {
    if (!tournamentId || tournamentId.trim() === '') {
      setTournamentIdError('');
      return false;
    }

    setCheckingTournamentId(true);
    setTournamentIdError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/tournament/${tournamentId}`);
      if (response.data.tournament_id) {
        setTournamentIdError(`Tournament ID already exists. Please enter another tournament ID.`);
        return true; 
      }
      return false; 
    } catch (error: any) {
      if (error.response?.status === 404) {

        return false;
      }
      console.error('Error checking tournament ID:', error);
      return false;
    } finally {
      setCheckingTournamentId(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'tournament_year' 
        ? (value === '' ? '' : parseInt(value, 10))
        : value,
    }));

    if (name === 'tournament_id') {
      setTournamentIdError('');
    }
  };

  const handleTournamentIdBlur = async () => {
    if (formData.tournament_id && formData.tournament_id.trim() !== '') {
      await checkTournamentId(formData.tournament_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!formData.tournament_id || !formData.tournament_year || !formData.season || 
        !formData.start_date || !formData.end_date) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      setLoading(false);
      return;
    }

    const year = typeof formData.tournament_year === 'string' 
      ? parseInt(formData.tournament_year, 10) 
      : formData.tournament_year;
    
    if (year < 2000 || year > 2025) {
      setMessage({ type: 'error', text: 'Tournament year must be between 2000 and 2025' });
      setLoading(false);
      return;
    }

    // Validate dates
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (endDate < startDate) {
      setMessage({ type: 'error', text: 'End date must be greater than or equal to start date' });
      setLoading(false);
      return;
    }

   
    const idExists = await checkTournamentId(formData.tournament_id);
    if (idExists) {
      setMessage({ type: 'error', text: 'Please enter another tournament ID as this ID already exists' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/tournament`, formData);
      setMessage({ type: 'success', text: response.data.message || 'Tournament created successfully!' });
      
     
      setTimeout(() => {
        setFormData({
          tournament_id: '',
          tournament_year: '',
          season: '',
          start_date: '',
          end_date: '',
        });
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create tournament',
      });
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
            Create Tournament
          </h1>
          <p className="text-gray-600 mt-2">
            Create a new tournament in the database
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tournament Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tournament ID *
                </label>
                <input
                  type="text"
                  name="tournament_id"
                  value={formData.tournament_id}
                  onChange={handleChange}
                  onBlur={handleTournamentIdBlur}
                  required
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    tournamentIdError 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Max 10 characters"
                  disabled={checkingTournamentId}
                />
                {checkingTournamentId && (
                  <p className="mt-1 text-sm text-gray-500">Checking availability...</p>
                )}
                {tournamentIdError && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{tournamentIdError}</p>
                )}
                {formData.tournament_id && !tournamentIdError && !checkingTournamentId && (
                  <p className="mt-1 text-sm text-green-600">✓ Tournament ID is available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tournament Year * (2000-2025)
                </label>
                <input
                  type="number"
                  name="tournament_year"
                  value={formData.tournament_year}
                  onChange={handleChange}
                  required
                  min="2000"
                  max="2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Season *
                </label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Season</option>
                  <option value="fall">Fall</option>
                  <option value="spring">Spring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date * (must be &gt;= start date)
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  min={formData.start_date || undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !!tournamentIdError}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Tournament'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TournamentInsertPage;


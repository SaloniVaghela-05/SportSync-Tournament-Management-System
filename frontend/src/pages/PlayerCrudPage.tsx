import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface PlayerFormData {
  person_id: string;
  person_name: string;
  gender: string;
  dob: string;
  contact_no: string;
  college_name: string;
  roles: string;
  height: number | string;
  weight: number | string;
  bloodgroup: string;
  joining_year: number | string;
}

const PlayerCrudPage: React.FC<{ mode: 'insert' | 'update' | 'delete' }> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [formData, setFormData] = useState<PlayerFormData>({
    person_id: id || '',
    person_name: '',
    gender: '',
    dob: '',
    contact_no: '',
    college_name: '',
    roles: mode === 'insert' ? 'Player' : '',
    height: '',
    weight: '',
    bloodgroup: '',
    joining_year: '',
  });
  const [oldData, setOldData] = useState<PlayerFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fetchId, setFetchId] = useState(id || '');

  useEffect(() => {
    if (mode === 'update' && id) {
      fetchPlayerData(id);
    }
  }, [mode, id]);

  const fetchPlayerData = async (playerId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/player/${playerId}`);
      const player = response.data;
      setFormData({
        person_id: player.person_id,
        person_name: player.person_name || '',
        gender: player.gender || '',
        dob: player.dob || '',
        contact_no: player.contact_no || '',
        college_name: player.college_name || '',
        roles: player.roles || '',
        height: player.height || '',
        weight: player.weight || '',
        bloodgroup: player.bloodgroup || '',
        joining_year: player.joining_year || '',
      });
      setOldData({
        person_id: player.person_id,
        person_name: player.person_name || '',
        gender: player.gender || '',
        dob: player.dob || '',
        contact_no: player.contact_no || '',
        college_name: player.college_name || '',
        roles: player.roles || '',
        height: player.height || '',
        weight: player.weight || '',
        bloodgroup: player.bloodgroup || '',
        joining_year: player.joining_year || '',
      });
      setMessage({ type: 'success', text: 'Player data loaded successfully' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to fetch player data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'insert') {
        const response = await axios.post(`${API_BASE_URL}/player`, formData);
        setMessage({ type: 'success', text: response.data.message || 'Player inserted successfully!' });

        setFormData({
          person_id: '',
          person_name: '',
          gender: '',
          dob: '',
          contact_no: '',
          college_name: '',
          roles: '',
          height: '',
          weight: '',
          bloodgroup: '',
          joining_year: '',
        });
      } else if (mode === 'update') {
        const updateData: Partial<PlayerFormData> = {};
        
        
        if (formData.contact_no !== oldData?.contact_no) {
          updateData.contact_no = formData.contact_no;
        }
        if (formData.college_name !== oldData?.college_name) {
          updateData.college_name = formData.college_name;
        }
        if (formData.height !== oldData?.height) {
          updateData.height = formData.height;
        }
        if (formData.weight !== oldData?.weight) {
          updateData.weight = formData.weight;
        }
        if (formData.bloodgroup !== oldData?.bloodgroup) {
          updateData.bloodgroup = formData.bloodgroup;
        }

        if (Object.keys(updateData).length === 0) {
          setMessage({ type: 'error', text: 'No changes detected' });
          setLoading(false);
          return;
        }

        const response = await axios.put(`${API_BASE_URL}/player/${formData.person_id}`, updateData);
        setMessage({ type: 'success', text: response.data.message || 'Player updated successfully!' });
        
        if (response.data.new) {
          setOldData({ ...oldData, ...response.data.new } as PlayerFormData);
        }
      } else if (mode === 'delete') {
        if (!formData.person_id) {
          setMessage({ type: 'error', text: 'Please enter a player ID' });
          setLoading(false);
          return;
        }

        const response = await axios.delete(`${API_BASE_URL}/player/${formData.person_id}`);
        setMessage({ type: 'success', text: response.data.message || 'Player deleted successfully!' });
        
        setFormData({
          person_id: '',
          person_name: '',
          gender: '',
          dob: '',
          contact_no: '',
          college_name: '',
          roles: '',
          height: '',
          weight: '',
          bloodgroup: '',
          joining_year: '',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || `Failed to ${mode} player`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClick = () => {
    if (fetchId) {
      fetchPlayerData(fetchId);
      setFormData((prev) => ({ ...prev, person_id: fetchId }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: 
        name === 'height' || name === 'weight' || name === 'joining_year'
          ? (value === '' ? '' : (name === 'joining_year' ? parseInt(value, 10) : parseFloat(value)))
          : value,
    }));
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
          <h1 className="text-4xl font-bold text-gray-800 capitalize">
            {mode} Player
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'insert' && 'Q2: Insert a new player into Person and Player tables'}
            {mode === 'update' && 'Q3: Update player information'}
            {mode === 'delete' && 'Q4: Delete a player from the database'}
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
          {mode === 'update' && (
            <div className="mb-6">
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Enter Player ID"
                  value={fetchId}
                  onChange={(e) => setFetchId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleFetchClick}
                  disabled={loading || !fetchId}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fetch Data
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode !== 'delete' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Person ID *
                    </label>
                    <input
                      type="text"
                      name="person_id"
                      value={formData.person_id}
                      onChange={handleChange}
                      required
                      disabled={mode === 'update'}
                      maxLength={10}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Max 10 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Person Name *
                    </label>
                    <input
                      type="text"
                      name="person_name"
                      value={formData.person_name}
                      onChange={handleChange}
                      required={mode === 'insert'}
                      disabled={mode === 'update'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required={mode === 'insert'}
                      disabled={mode === 'update'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      required={mode === 'insert'}
                      disabled={mode === 'update'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number * (10 digits)
                    </label>
                    <input
                      type="text"
                      name="contact_no"
                      value={formData.contact_no}
                      onChange={handleChange}
                      required={mode === 'insert'}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College Name
                    </label>
                    <input
                      type="text"
                      name="college_name"
                      value={formData.college_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roles
                    </label>
                    <input
                      type="text"
                      name="roles"
                      value={formData.roles}
                      onChange={handleChange}
                      disabled={mode === 'insert' || mode === 'update'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Player (default)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      required={mode === 'insert'}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      required={mode === 'insert'}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      name="bloodgroup"
                      value={formData.bloodgroup}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Year *
                    </label>
                    <input
                      type="number"
                      name="joining_year"
                      value={formData.joining_year}
                      onChange={handleChange}
                      required={mode === 'insert'}
                      disabled={mode === 'update'}
                      min="2000"
                      max="2099"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {mode === 'update' && oldData && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Comparison (Old vs New)</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Old Contact No:</div>
                        <div className="text-gray-800">{oldData.contact_no}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">New Contact No:</div>
                        <div className="text-gray-800">{formData.contact_no}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Old College Name:</div>
                        <div className="text-gray-800">{oldData.college_name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">New College Name:</div>
                        <div className="text-gray-800">{formData.college_name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Old Height (cm):</div>
                        <div className="text-gray-800">{oldData.height}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">New Height (cm):</div>
                        <div className="text-gray-800">{formData.height}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Old Weight (kg):</div>
                        <div className="text-gray-800">{oldData.weight}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">New Weight (kg):</div>
                        <div className="text-gray-800">{formData.weight}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Old Blood Group:</div>
                        <div className="text-gray-800">{oldData.bloodgroup || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">New Blood Group:</div>
                        <div className="text-gray-800">{formData.bloodgroup || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Player ID *
                </label>
                <input
                  type="text"
                  name="person_id"
                  value={formData.person_id}
                  onChange={handleChange}
                  required
                  placeholder="Enter Player ID to delete"
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : mode === 'delete' ? 'Delete Player' : `Submit ${mode === 'insert' ? 'Insert' : 'Update'}`}
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

export default PlayerCrudPage;

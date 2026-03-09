import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface PersonFormData {
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
  tournament_id: string;
  pass_type: string;
}

interface Tournament {
  tournament_id: string;
  tournament_year: number;
  season: string;
  start_date: string;
  end_date: string;
}

const PersonInsertPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'basic' | 'role'>('basic');
  const [formData, setFormData] = useState<PersonFormData>({
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
    tournament_id: '',
    pass_type: '',
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [personIdError, setPersonIdError] = useState<string>('');
  const [checkingPersonId, setCheckingPersonId] = useState(false);

  
  useEffect(() => {
    if (formData.roles === 'Spectator') {
      fetchUpcomingTournaments();
    }
  }, [formData.roles]);

  const fetchUpcomingTournaments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournament/upcoming`);
      console.log('Tournaments fetched:', response.data);
      setTournaments(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setMessage(null);
      }
    } catch (error: any) {
      console.error('Error fetching upcoming tournaments:', error);
      console.error('Error details:', error.response?.data);
      setTournaments([]);
    }
  };

  const checkPersonId = async (personId: string) => {
    if (!personId || personId.trim() === '') {
      setPersonIdError('');
      return false;
    }

    setCheckingPersonId(true);
    setPersonIdError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/person/check/${encodeURIComponent(personId)}`);
    
      console.log('Person ID check response:', response.data);
      if (response.data && response.data.exists === true) {

        console.log(`Person ID ${personId} EXISTS in database`);
        setPersonIdError(`Person ID already exists. Please enter another person ID.`);
        return true; 
      } else if (response.data && response.data.exists === false) {
        
        console.log(`Person ID ${personId} is AVAILABLE (not in database)`);
        setPersonIdError(''); 
        return false; 
      } else {
        
        console.error('Unexpected response format:', response.data);
        setPersonIdError('');
        return false;
      }
    } catch (error: any) {
      console.error('Error checking person ID:', error);
      console.error('Error response:', error.response);
      
      if (!error.response) {

        console.warn('Network error: Cannot reach backend server');
        setPersonIdError(''); 
        return false;
      }
      
    
      if (error.response.status === 404) {
        console.error('API endpoint /api/person/check not found. Check backend server is running and routes are configured.');
       
        setPersonIdError('');
        return false;
      }
      
      
      if (error.response.status >= 500) {
        console.error('Server error while checking person ID');
        setPersonIdError('');
        return false;
      }
      
      
      setPersonIdError('');
      return false;
    } finally {
      setCheckingPersonId(false);
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
    
   
    if (name === 'person_id') {
      setPersonIdError('');
    }
  };

  const handlePersonIdBlur = async () => {
    if (formData.person_id && formData.person_id.trim() !== '') {
      await checkPersonId(formData.person_id);
    }
  };

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.person_id || !formData.person_name || !formData.gender || !formData.dob || !formData.contact_no) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.contact_no)) {
      setMessage({ type: 'error', text: 'Contact number must be exactly 10 digits' });
      return;
    }
    
   
    const idExists = await checkPersonId(formData.person_id);
    if (idExists) {
      setMessage({ type: 'error', text: 'Please enter another person ID as this ID already exists' });
      return;
    }
    
    setStep('role');
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    
    const idExists = await checkPersonId(formData.person_id);
    if (idExists) {
      setMessage({ type: 'error', text: 'Please enter another person ID as this ID already exists' });
      setLoading(false);
      return;
    }

    try {
      if (formData.roles === 'Player') {
        
        if (!formData.height || !formData.weight || !formData.joining_year) {
          setMessage({ type: 'error', text: 'Please fill all required player fields' });
          setLoading(false);
          return;
        }
        const response = await axios.post(`${API_BASE_URL}/person/player`, formData);
        setMessage({ type: 'success', text: response.data.message || 'Player created successfully!' });
      } else if (formData.roles === 'Spectator') {
        if (!formData.tournament_id || !formData.pass_type) {
          setMessage({ type: 'error', text: 'Please select tournament and pass type' });
          setLoading(false);
          return;
        }
        const response = await axios.post(`${API_BASE_URL}/person/spectator`, formData);
        setMessage({ type: 'success', text: response.data.message || 'Spectator created successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Please select a role' });
        setLoading(false);
        return;
      }

      
      setTimeout(() => {
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
          tournament_id: '',
          pass_type: '',
        });
        setStep('basic');
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create person',
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
            Register New Person
          </h1>
          <p className="text-gray-600 mt-2">
            Step {step === 'basic' ? '1' : '2'}: {step === 'basic' ? 'Basic Information' : 'Role Selection & Details'}
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
          {step === 'basic' ? (
            <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Basic Information</h2>
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
                    onBlur={handlePersonIdBlur}
                    required
                    maxLength={10}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      personIdError 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Max 10 characters"
                    disabled={checkingPersonId}
                  />
                  {checkingPersonId && (
                    <p className="mt-1 text-sm text-gray-500">Checking availability...</p>
                  )}
                  {personIdError && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{personIdError}</p>
                  )}
                  {formData.person_id && !personIdError && !checkingPersonId && (
                    <p className="mt-1 text-sm text-green-600">✓ Person ID is available</p>
                  )}
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
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    required
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
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Next: Select Role
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Role Selection & Details</h2>
                <button
                  type="button"
                  onClick={() => setStep('basic')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to Basic Info
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  name="roles"
                  value={formData.roles}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Role</option>
                  <option value="Player">Player</option>
                  <option value="Spectator">Spectator</option>
                </select>
              </div>

              {/* Player Fields */}
              {formData.roles === 'Player' && (
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Player Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height (cm) *
                      </label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        required
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
                        required
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
                        required
                        min="2000"
                        max="2099"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Spectator Fields */}
              {formData.roles === 'Spectator' && (
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Spectator Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tournament * (Start Date &gt;= Today)
                      </label>
                      {tournaments.length > 0 ? (
                        <select
                          name="tournament_id"
                          value={formData.tournament_id}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Tournament</option>
                          {tournaments.map((tournament) => {
                            const startDate = new Date(tournament.start_date).toLocaleDateString();
                            const isUpcoming = new Date(tournament.start_date) > new Date();
                            return (
                              <option key={tournament.tournament_id} value={tournament.tournament_id}>
                                ID: {tournament.tournament_id} | Start: {startDate} | {tournament.tournament_year} - {tournament.season} {isUpcoming ? '(Upcoming)' : '(Ongoing)'}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <div className="px-4 py-2 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-800">
                          No upcoming tournaments available (start_date &gt;= today). Please create a tournament first.
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pass Type *
                      </label>
                      <select
                        name="pass_type"
                        value={formData.pass_type}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Pass Type</option>
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="regular">Regular</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || (formData.roles === 'Spectator' && tournaments.length === 0)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : `Submit ${formData.roles || 'Registration'}`}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonInsertPage;


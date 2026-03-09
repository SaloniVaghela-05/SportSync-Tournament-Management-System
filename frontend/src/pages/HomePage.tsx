import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const HomePage = () => {
  const [dbStatus, setDbStatus] = useState<{ status: string; database?: string; error?: string } | null>(null);

  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/db-check`);
      
      setDbStatus(response.data);
    } catch (error: any) {

      if (error.response?.data) {
        
        setDbStatus(error.response.data);
      } else {
        
        setDbStatus({
          status: 'Disconnected',
          error: error.message || 'Unable to check database connection',
          suggestion: 'Make sure the backend server is running on port 5000',
        });
      }
    }
  };

  const queries = [
    { id: '1', title: 'Register Person', path: '/insert/person', description: 'Register a new person (Player or Spectator) with conditional form' },
    { id: '2', title: 'Create Tournament', path: '/insert/tournament', description: 'Create a new tournament (Tournament table)' },
    { id: '3', title: 'Insert Player', path: '/insert/player', description: 'Insert a new player (Person + Player tables)' },
    { id: '4', title: 'Update Player', path: '/update/player', description: 'Update player information (contact_no, college_name, etc.)' },
    { id: '5', title: 'Delete Player', path: '/delete/player', description: 'Delete a player from the database' },
    { id: '6', title: 'Multi-Department Organizers', path: '/report/q22', description: 'Organizers who worked in both Logistics and Marketing' },
    { id: '7', title: 'Fall Undefeated Teams', path: '/report/q30', description: 'Teams with win outcome in every Fall match' },
    { id: '8', title: 'Player Team & College', path: '/function/q36', description: 'Get current team and college for a player (PostgreSQL Function)' },
    { id: '9', title: 'Top Scoring Players', path: '/report/top-scoring', description: 'Top 10 players with highest total scores' },
    { id: '10', title: 'Team Win Statistics', path: '/report/team-stats', description: 'Win/Loss/Draw statistics for each team' },
    { id: '11', title: 'Tournament Participants', path: '/report/tournament-participants', description: 'All players participating in each tournament' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Sport Tournament Database Manager
          </h1>
         
          
          {/* Database Connection Status */}
          {dbStatus && (
            <div className={`mt-4 max-w-2xl mx-auto px-4 py-3 rounded-lg ${
              dbStatus.status === 'Connected' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    dbStatus.status === 'Connected' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="font-medium">
                    Database: {dbStatus.status} 
                    {dbStatus.database && ` (${dbStatus.database})`}
                  </span>
                </div>
                <button
                  onClick={checkDatabaseConnection}
                  className="text-sm px-3 py-1 bg-white rounded hover:bg-gray-50 border border-gray-300"
                >
                  Refresh
                </button>
              </div>
              {dbStatus.status === 'Connected' && (
                <div className="text-sm mt-2">
                  <div>Host: {dbStatus.host}:{dbStatus.port}</div>
                  {dbStatus.postgres_version && (
                    <div>PostgreSQL: {dbStatus.postgres_version}</div>
                  )}
                </div>
              )}
              {dbStatus.status === 'Disconnected' && (
                <div className="text-sm mt-2 space-y-1">
                  {dbStatus.error && (
                    <div className="font-semibold">Error: {dbStatus.error}</div>
                  )}
                  {dbStatus.code && (
                    <div>Code: {dbStatus.code}</div>
                  )}
                  {dbStatus.suggestion && (
                    <div className="italic mt-1">💡 {dbStatus.suggestion}</div>
                  )}
                  {dbStatus.host && (
                    <div className="text-xs mt-1">Trying to connect to: {dbStatus.host}:{dbStatus.port}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queries.map((query) => (
            <Link
              key={query.id}
              to={query.path}
              className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border-l-4 border-blue-500"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-800">{query.title}</h3>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {query.id}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{query.description}</p>
              <div className="mt-4 flex items-center text-blue-600 font-medium">
                <span>View →</span>
              </div>
            </Link>
          ))}
        </div>

       
      </div>
    </div>
  );
};

export default HomePage;


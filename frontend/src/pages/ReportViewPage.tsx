import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReportTable from '../components/ReportTable';

const API_BASE_URL = 'http://localhost:5000/api';

interface ReportViewPageProps {
  reportType: 'multidept-organizers' | 'fall-undefeated' | 'top-scoring-players' | 'team-win-statistics' | 'tournament-participants';
}

const ReportViewPage: React.FC<ReportViewPageProps> = ({ reportType }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/report/${reportType}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const getReportInfo = () => {
    const reportInfoMap: Record<string, { title: string; description: string }> = {
      'multidept-organizers': {
        title: 'Q22 - Multi-Department Organizers',
        description: 'Organizers who worked in both Logistics and Marketing departments',
      },
      'fall-undefeated': {
        title: 'Q30 - Fall Undefeated Teams',
        description: 'Teams with a win outcome in every Fall match',
      },
      'top-scoring-players': {
        title: 'Top Scoring Players',
        description: 'Top 10 players with highest total scores across all matches',
      },
      'team-win-statistics': {
        title: 'Team Win Statistics',
        description: 'Win/Loss/Draw statistics for each team',
      },
      'tournament-participants': {
        title: 'Tournament Participants',
        description: 'All players participating in each tournament',
      },
    };

    return reportInfoMap[reportType] || {
      title: 'Report',
      description: 'View report data',
    };
  };

  const reportInfo = getReportInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl font-bold text-gray-800">{reportInfo.title}</h1>
          <p className="text-gray-600 mt-2">{reportInfo.description}</p>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-600">Loading report data...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 border border-red-300 rounded-lg p-4 mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && data && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total records: <strong>{data.count || 0}</strong>
              </div>
              <button
                onClick={fetchReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Refresh
              </button>
            </div>
            <ReportTable
              data={data.data || []}
              title={data.query}
              description={data.description}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportViewPage;

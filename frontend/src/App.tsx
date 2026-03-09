import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlayerCrudPage from './pages/PlayerCrudPage';
import FunctionCallPage from './pages/FunctionCallPage';
import ReportViewPage from './pages/ReportViewPage';
import PersonInsertPage from './pages/PersonInsertPage';
import TournamentInsertPage from './pages/TournamentInsertPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/insert/person" element={<PersonInsertPage />} />
        <Route path="/insert/tournament" element={<TournamentInsertPage />} />
        <Route path="/insert/player" element={<PlayerCrudPage mode="insert" />} />
        <Route path="/update/player/:id?" element={<PlayerCrudPage mode="update" />} />
        <Route path="/delete/player/:id?" element={<PlayerCrudPage mode="delete" />} />
        <Route path="/report/q22" element={<ReportViewPage reportType="multidept-organizers" />} />
        <Route path="/report/q30" element={<ReportViewPage reportType="fall-undefeated" />} />
        <Route path="/report/top-scoring" element={<ReportViewPage reportType="top-scoring-players" />} />
        <Route path="/report/team-stats" element={<ReportViewPage reportType="team-win-statistics" />} />
        <Route path="/report/tournament-participants" element={<ReportViewPage reportType="tournament-participants" />} />
        <Route path="/function/q36" element={<FunctionCallPage />} />
      </Routes>
    </Router>
  );
}

export default App;


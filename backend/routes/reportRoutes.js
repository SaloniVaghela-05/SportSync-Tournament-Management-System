const express = require('express');
const router = express.Router();
const { query } = require('../db/db');


router.get('/multidept-organizers', async (req, res) => {
  try {
    const reportQuery = `
      SELECT DISTINCT o.member_id, org.member_name, org.contact_no
      FROM OrganizeTournament o
      JOIN Organizer org ON o.member_id = org.member_id
      WHERE LOWER(o.department) = 'logistics'
      INTERSECT
      SELECT DISTINCT o.member_id, org.member_name, org.contact_no
      FROM OrganizeTournament o
      JOIN Organizer org ON o.member_id = org.member_id
      WHERE LOWER(o.department) = 'marketing'
      ORDER BY member_id;
    `;

    const result = await query(reportQuery);

    res.json({
      query: 'Q22 - Multi-Department Organizers',
      description: 'Organizers who worked in both Logistics and Marketing departments',
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching multi-dept organizers report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      details: error.message,
    });
  }
});


router.get('/fall-undefeated', async (req, res) => {
  try {
    const reportQuery = `
      SELECT DISTINCT t.team_id, t.team_name, t.sport_id, s.sport_name
      FROM Team t
      JOIN Sports s ON t.sport_id = s.sport_id
      WHERE NOT EXISTS (
        SELECT 1
        FROM Result r
        JOIN Match m ON r.match_id = m.match_id
        JOIN Tournament tour ON m.tournament_id = tour.tournament_id
        WHERE r.team_id = t.team_id
          AND LOWER(tour.season) = 'fall'
          AND LOWER(r.outcome) != 'win'
      )
      AND EXISTS (
        SELECT 1
        FROM Result r
        JOIN Match m ON r.match_id = m.match_id
        JOIN Tournament tour ON m.tournament_id = tour.tournament_id
        WHERE r.team_id = t.team_id
          AND LOWER(tour.season) = 'fall'
          AND LOWER(r.outcome) = 'win'
      )
      ORDER BY t.team_id;
    `;

    const result = await query(reportQuery);

    res.json({
      query: 'Q30 - Fall Undefeated Teams',
      description: 'Teams with a win outcome in every Fall match',
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching Fall undefeated teams report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      details: error.message,
    });
  }
});


router.get('/top-scoring-players', async (req, res) => {
  try {
    const reportQuery = `
      SELECT 
        pl.player_id,
        p.person_name,
        s.sport_name,
        SUM(ps.score) as total_score,
        COUNT(ps.match_id) as matches_played
      FROM PlayerStatistics ps
      JOIN Player pl ON ps.player_id = pl.player_id
      JOIN Person p ON pl.player_id = p.person_id
      JOIN Match m ON ps.match_id = m.match_id
      JOIN Sports s ON m.sport_id = s.sport_id
      GROUP BY pl.player_id, p.person_name, s.sport_name
      ORDER BY total_score DESC
      LIMIT 10;
    `;

    const result = await query(reportQuery);

    res.json({
      query: 'Top Scoring Players',
      description: 'Top 10 players with highest total scores across all matches',
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching top scoring players report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      details: error.message,
    });
  }
});


router.get('/team-win-statistics', async (req, res) => {
  try {
    const reportQuery = `
      SELECT 
        t.team_id,
        t.team_name,
        s.sport_name,
        COUNT(CASE WHEN LOWER(r.outcome) = 'win' THEN 1 END) as wins,
        COUNT(CASE WHEN LOWER(r.outcome) = 'loss' THEN 1 END) as losses,
        COUNT(CASE WHEN LOWER(r.outcome) = 'draw' THEN 1 END) as draws,
        COUNT(r.match_id) as total_matches
      FROM Team t
      JOIN Sports s ON t.sport_id = s.sport_id
      LEFT JOIN Result r ON t.team_id = r.team_id
      GROUP BY t.team_id, t.team_name, s.sport_name
      ORDER BY wins DESC, total_matches DESC;
    `;

    const result = await query(reportQuery);

    res.json({
      query: 'Team Win Statistics',
      description: 'Win/Loss/Draw statistics for each team',
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching team win statistics report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      details: error.message,
    });
  }
});

router.get('/tournament-participants', async (req, res) => {
  try {
    const reportQuery = `
      SELECT DISTINCT
        tour.tournament_id,
        tour.tournament_year,
        tour.season,
        p.person_id,
        p.person_name,
        pl.height,
        pl.weight,
        p.college_name
      FROM Tournament tour
      JOIN Match m ON tour.tournament_id = m.tournament_id
      JOIN PlayerPlaysMatch ppm ON m.match_id = ppm.match_id
      JOIN Player pl ON ppm.player_id = pl.player_id
      JOIN Person p ON pl.player_id = p.person_id
      ORDER BY tour.tournament_id, p.person_name;
    `;

    const result = await query(reportQuery);

    res.json({
      query: 'Tournament Participants',
      description: 'All players participating in each tournament',
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching tournament participants report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      details: error.message,
    });
  }
});

module.exports = router;

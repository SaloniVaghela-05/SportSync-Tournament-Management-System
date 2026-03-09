const express = require('express');
const router = express.Router();
const { query } = require('../db/db');


router.get('/current', async (req, res) => {
  try {
    const tournamentQuery = `
      SELECT 
        tournament_id,
        tournament_year,
        season,
        start_date,
        end_date
      FROM Tournament
      WHERE start_date <= CURRENT_DATE 
        AND end_date >= CURRENT_DATE
      ORDER BY start_date DESC;
    `;

    const result = await query(tournamentQuery);

    res.json({
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching current tournaments:', error);
    res.status(500).json({
      error: 'Failed to fetch current tournaments',
      details: error.message,
    });
  }
});


router.get('/upcoming', async (req, res) => {
  try {
    const tournamentQuery = `
      SELECT 
        tournament_id,
        tournament_year,
        season,
        start_date,
        end_date
      FROM Tournament
      WHERE start_date >= CURRENT_DATE
      ORDER BY start_date ASC;
    `;

    console.log('Fetching upcoming tournaments (start_date >= CURRENT_DATE)');
    const result = await query(tournamentQuery);
    console.log(`Found ${result.rows.length} upcoming tournament(s)`);

    res.json({
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching upcoming tournaments:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      error: 'Failed to fetch upcoming tournaments',
      details: error.message,
    });
  }
});


router.get('/', async (req, res) => {
  try {
    const tournamentQuery = `
      SELECT 
        tournament_id,
        tournament_year,
        season,
        start_date,
        end_date
      FROM Tournament
      ORDER BY tournament_year DESC, start_date DESC;
    `;

    const result = await query(tournamentQuery);

    res.json({
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      error: 'Failed to fetch tournaments',
      details: error.message,
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tournamentQuery = `
      SELECT 
        tournament_id,
        tournament_year,
        season,
        start_date,
        end_date
      FROM Tournament
      WHERE tournament_id = $1;
    `;

    const result = await query(tournamentQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({
      error: 'Failed to fetch tournament',
      details: error.message,
    });
  }
});


router.post('/', async (req, res) => {
  try {
    const {
      tournament_id,
      tournament_year,
      season,
      start_date,
      end_date,
    } = req.body;

    
    if (!tournament_id || !tournament_year || !season || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Missing required fields: tournament_id, tournament_year, season, start_date, end_date',
      });
    }

    
    if (tournament_year < 2000 || tournament_year > 2025) {
      return res.status(400).json({
        error: 'tournament_year must be between 2000 and 2025',
      });
    }

    
    const validSeasons = ['fall', 'spring'];
    if (!validSeasons.includes(season.toLowerCase())) {
      return res.status(400).json({
        error: 'season must be either "fall" or "spring"',
      });
    }

    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        error: 'end_date must be greater than or equal to start_date',
      });
    }

    
    const insertQuery = `
      INSERT INTO Tournament (tournament_id, tournament_year, season, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await query(insertQuery, [
      tournament_id,
      tournament_year,
      season.toLowerCase(),
      start_date,
      end_date,
    ]);

    res.status(201).json({
      message: 'Tournament created successfully',
      tournament: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    
    if (error.code === '23505') {
      res.status(409).json({ error: 'Tournament ID already exists' });
    } else if (error.code === '23514') {
      res.status(400).json({ error: 'Check constraint violation: ' + error.message });
    } else {
      res.status(500).json({
        error: 'Failed to create tournament',
        details: error.message,
      });
    }
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const { query } = require('../db/db');

router.get('/player-team-college/:id', async (req, res) => {
  try {
    const { id } = req.params;

    
    if (!id || id.trim() === '') {
      return res.status(400).json({
        error: 'Player ID is required',
      });
    }

    
    const functionQuery = `
      SELECT * FROM get_player_current_team_info($1);
    `;

    console.log(`Calling function get_player_current_team_info for player: ${id}`);
    const result = await query(functionQuery, [id]);
    console.log(`Function returned ${result.rows.length} row(s)`);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No current team found for this player. Player may not be assigned to any team or all team assignments have ended.',
        player_id: id,
      });
    }

    res.json({
      query: 'Q36 - Player Team and College',
      description: 'Get current team and college for a player using PostgreSQL function',
      player_id: id,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error calling player-team-college function:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    
    if (error.code === '42883' || error.message.includes('does not exist') || error.message.includes('function get_player_current_team_info')) {
      return res.status(500).json({
        error: 'PostgreSQL function get_player_current_team_info does not exist',
        details: 'Please create the function in your database. Run the SQL in FUNCTION_FIX.sql file.',
        sql_error: error.message,
        sql_code: error.code,
        player_id: req.params.id,
        solution: 'Execute: CREATE OR REPLACE FUNCTION get_player_current_team_info(p_player_id VARCHAR) ... (see FUNCTION_FIX.sql)',
      });
    }
    
   
    if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
      return res.status(500).json({
        error: 'Database table or column does not exist',
        details: error.message,
        sql_error: error.message,
        sql_code: error.code,
        player_id: req.params.id,
      });
    }
    
    res.status(500).json({
      error: 'Failed to call function',
      details: error.message,
      sql_error: error.message,
      sql_code: error.code || 'UNKNOWN',
      player_id: req.params.id,
      hint: 'Check if the function exists in your database. See FUNCTION_FIX.sql for the correct SQL definition.',
    });
  }
});

module.exports = router;


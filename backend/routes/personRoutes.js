const express = require('express');
const router = express.Router();
const { query, pool } = require('../db/db');


router.get('/check/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        exists: false,
        error: 'Person ID is required',
      });
    }

    
    const trimmedId = id.trim();

    const checkQuery = `
      SELECT person_id, person_name, roles
      FROM Person
      WHERE person_id = $1;
    `;

    console.log(`Checking person ID: "${trimmedId}"`);

    const result = await query(checkQuery, [trimmedId]);

    console.log(`Query result rows:`, result.rows.length);

    
    if (result && result.rows && result.rows.length > 0) {
      console.log(`✓ Person ID "${trimmedId}" EXISTS in database - Person:`, result.rows[0]);
      return res.json({
        exists: true,
        person: result.rows[0],
      });
    } else {
      console.log(`✗ Person ID "${trimmedId}" does NOT exist in database`);
      return res.json({
        exists: false,
      });
    }
  } catch (error) {
    console.error('Error checking person ID:', error);
    res.status(500).json({
      exists: false,
      error: 'Failed to check person ID',
      details: error.message,
    });
  }
});


router.post('/player', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      person_id,
      person_name,
      gender,
      dob,
      contact_no,
      college_name,
      roles,
      height,
      weight,
      bloodgroup,
      joining_year,
    } = req.body;

    
    if (!person_id || !person_name || !gender || !dob || !contact_no || 
        height === undefined || weight === undefined || !joining_year) {
      return res.status(400).json({
        error: 'Missing required fields: person_id, person_name, gender, dob, contact_no, height, weight, joining_year',
      });
    }

    
    if (!/^[0-9]{10}$/.test(contact_no)) {
      return res.status(400).json({
        error: 'contact_no must be exactly 10 digits',
      });
    }

    
    const genderLower = gender.toLowerCase();

    await client.query('BEGIN');

    
    const personQuery = `
      INSERT INTO Person (person_id, person_name, gender, dob, contact_no, college_name, roles)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const personResult = await client.query(personQuery, [
      person_id,
      person_name,
      genderLower,
      dob,
      contact_no,
      college_name || null,
      roles || 'Player',
    ]);

    
    const playerQuery = `
      INSERT INTO Player (player_id, height, weight, bloodgroup, joining_year)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const playerResult = await client.query(playerQuery, [
      person_id,
      height,
      weight,
      bloodgroup || null,
      joining_year,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Player created successfully',
      person: personResult.rows[0],
      player: playerResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting player:', error);
    
    if (error.code === '23505') {
      res.status(409).json({ error: 'Person ID already exists' });
    } else if (error.code === '23503') {
      res.status(400).json({ error: 'Foreign key constraint violation' });
    } else if (error.code === '23514') {
      res.status(400).json({ error: 'Check constraint violation: ' + error.message });
    } else {
      res.status(500).json({ error: 'Failed to insert player', details: error.message });
    }
  } finally {
    client.release();
  }
});


router.post('/spectator', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      person_id,
      person_name,
      gender,
      dob,
      contact_no,
      college_name,
      roles,
      tournament_id,
      pass_type,
    } = req.body;

    
    if (!person_id || !person_name || !gender || !dob || !contact_no || 
        !tournament_id || !pass_type) {
      return res.status(400).json({
        error: 'Missing required fields: person_id, person_name, gender, dob, contact_no, tournament_id, pass_type',
      });
    }

    
    if (!/^[0-9]{10}$/.test(contact_no)) {
      return res.status(400).json({
        error: 'contact_no must be exactly 10 digits',
      });
    }

   
    const validPassTypes = ['gold', 'silver', 'regular'];
    if (!validPassTypes.includes(pass_type.toLowerCase())) {
      return res.status(400).json({
        error: 'pass_type must be one of: gold, silver, regular',
      });
    }

    
    const genderLower = gender.toLowerCase();

    await client.query('BEGIN');

    
    const personQuery = `
      INSERT INTO Person (person_id, person_name, gender, dob, contact_no, college_name, roles)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const personResult = await client.query(personQuery, [
      person_id,
      person_name,
      genderLower,
      dob,
      contact_no,
      college_name || null,
      roles || 'Spectator',
    ]);

    
    const spectatorQuery = `
      INSERT INTO SpectatorPass (spectator_id, tournament_id, pass_type)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const spectatorResult = await client.query(spectatorQuery, [
      person_id,
      tournament_id,
      pass_type.toLowerCase(),
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Spectator created successfully',
      person: personResult.rows[0],
      spectator_pass: spectatorResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting spectator:', error);
    
    if (error.code === '23505') {
      res.status(409).json({ error: 'Person ID already exists or spectator pass already exists for this tournament' });
    } else if (error.code === '23503') {
      res.status(400).json({ error: 'Foreign key constraint violation. Tournament may not exist.' });
    } else if (error.code === '23514') {
      res.status(400).json({ error: 'Check constraint violation: ' + error.message });
    } else {
      res.status(500).json({ error: 'Failed to insert spectator', details: error.message });
    }
  } finally {
    client.release();
  }
});

module.exports = router;


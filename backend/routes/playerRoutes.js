const express = require('express');
const router = express.Router();
const { query, pool } = require('../db/db');


router.post('/', async (req, res) => {
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
      gender.toLowerCase(),
      dob,
      contact_no,
      college_name || null,
      roles || null,
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


router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { contact_no, college_name, height, weight, bloodgroup } = req.body;

    
    const oldDataQuery = `
      SELECT p.person_id, p.person_name, p.gender, p.dob, p.contact_no, p.college_name, p.roles,
             pl.height, pl.weight, pl.bloodgroup, pl.joining_year
      FROM Person p
      JOIN Player pl ON p.person_id = pl.player_id
      WHERE p.person_id = $1;
    `;
    const oldDataResult = await query(oldDataQuery, [id]);

    if (oldDataResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const oldData = oldDataResult.rows[0];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (person_name !== undefined) {
      updates.push(`person_name = $${paramIndex++}`);
      values.push(person_name);
    }

    if (gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`);
      values.push(gender.toLowerCase()); 
    }

    if (dob !== undefined) {
      updates.push(`dob = $${paramIndex++}`);
      values.push(dob);
    }

    if (contact_no !== undefined) {
      if (!/^[0-9]{10}$/.test(contact_no)) {
        return res.status(400).json({ error: 'contact_no must be exactly 10 digits' });
      }
      updates.push(`contact_no = $${paramIndex++}`);
      values.push(contact_no);
    }

    if (college_name !== undefined) {
      updates.push(`college_name = $${paramIndex++}`);
      values.push(college_name);
    }

    if (updates.length === 0 && height === undefined && weight === undefined && bloodgroup === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    
    let newPersonData = oldData;
    if (updates.length > 0) {
      values.push(id);
      const updatePersonQuery = `
        UPDATE Person
        SET ${updates.join(', ')}
        WHERE person_id = $${paramIndex}
        RETURNING *;
      `;
      const updatePersonResult = await query(updatePersonQuery, values);
      newPersonData = { ...oldData, ...updatePersonResult.rows[0] };
    }

    
    const playerUpdates = [];
    const playerValues = [];
    let playerParamIndex = 1;

    if (height !== undefined) {
      playerUpdates.push(`height = $${playerParamIndex++}`);
      playerValues.push(height);
    }

    if (weight !== undefined) {
      playerUpdates.push(`weight = $${playerParamIndex++}`);
      playerValues.push(weight);
    }

    if (bloodgroup !== undefined) {
      playerUpdates.push(`bloodgroup = $${playerParamIndex++}`);
      playerValues.push(bloodgroup);
    }

    let newPlayerData = oldData;
    if (playerUpdates.length > 0) {
      playerValues.push(id);
      const updatePlayerQuery = `
        UPDATE Player
        SET ${playerUpdates.join(', ')}
        WHERE player_id = $${playerParamIndex}
        RETURNING *;
      `;
      const updatePlayerResult = await query(updatePlayerQuery, playerValues);
      newPlayerData = { ...newPersonData, ...updatePlayerResult.rows[0] };
    } else {
      newPlayerData = newPersonData;
    }

    res.json({
      message: 'Player updated successfully',
      old: oldData,
      new: newPlayerData,
    });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player', details: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = `
      SELECT p.person_id, p.person_name, pl.height, pl.weight
      FROM Person p
      JOIN Player pl ON p.person_id = pl.player_id
      WHERE p.person_id = $1;
    `;
    const checkResult = await query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const deletedPlayer = checkResult.rows[0];

    const deleteQuery = `
      DELETE FROM Person
      WHERE person_id = $1;
    `;
    await query(deleteQuery, [id]);

    res.json({
      message: 'Player deleted successfully',
      deleted: deletedPlayer,
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player', details: error.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const getQuery = `
      SELECT p.person_id, p.person_name, p.gender, p.dob, p.contact_no, p.college_name, p.roles,
             pl.height, pl.weight, pl.bloodgroup, pl.joining_year
      FROM Person p
      JOIN Player pl ON p.person_id = pl.player_id
      WHERE p.person_id = $1;
    `;
    const result = await query(getQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player', details: error.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const getAllQuery = `
      SELECT p.person_id, p.person_name, p.gender, p.dob, p.contact_no, p.college_name, p.roles,
             pl.height, pl.weight, pl.bloodgroup, pl.joining_year
      FROM Person p
      JOIN Player pl ON p.person_id = pl.player_id
      ORDER BY p.person_id;
    `;
    const result = await query(getAllQuery);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players', details: error.message });
  }
});

module.exports = router;

-- ============================================================
-- Fixed PostgreSQL Function for Player Team and College
-- ============================================================
-- This function returns the current team name and college name for a player
-- 
-- TO INSTALL:
-- 1. Connect to your PostgreSQL database
-- 2. Run this entire SQL script
-- 3. The function will be created or replaced
--
-- TO TEST:
-- SELECT * FROM get_player_current_team_info('P001');
-- ============================================================

CREATE OR REPLACE FUNCTION get_player_current_team_info(p_player_id VARCHAR)
RETURNS TABLE (
    team_name VARCHAR,
    college_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        T.team_name,
        T.college_id AS college_name
    FROM
        PlayerTeam PT
    INNER JOIN
        Team T ON PT.team_id = T.team_id
    WHERE
        PT.player_id = p_player_id
        AND (PT.end_date IS NULL OR PT.end_date > CURRENT_DATE)
        AND PT.joining_date <= CURRENT_DATE
    ORDER BY PT.joining_date DESC
    LIMIT 1;
    
    -- If no rows found, RETURN QUERY automatically returns empty result set
    -- No additional RETURN statements needed
END;
$$ LANGUAGE plpgsql;

-- Test the function (uncomment to test)
-- SELECT * FROM get_player_current_team_info('P001');

-- Notes:
-- 1. This function finds teams where:
--    - The player is assigned to the team (PT.player_id = p_player_id)
--    - The assignment is still active (end_date IS NULL OR end_date > CURRENT_DATE)
--    - The player has already joined (joining_date <= CURRENT_DATE)
-- 2. Returns the most recent active team (ORDER BY joining_date DESC LIMIT 1)
-- 3. Returns team_name and college_id (as college_name)

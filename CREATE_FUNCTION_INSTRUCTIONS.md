# How to Create the PostgreSQL Function

## The Error You're Seeing

If you see "Failed to call function" error, it means the function `get_player_current_team_info` doesn't exist in your database yet.

## Solution: Create the Function

### Option 1: Using psql Command Line

1. Open your terminal/command prompt
2. Connect to your database:
   ```bash
   psql -U postgres -d sporttournament
   ```
   (Replace `postgres` with your username and `sporttournament` with your database name)

3. Copy and paste the entire contents of `FUNCTION_FIX.sql` into the psql prompt
4. Press Enter to execute

### Option 2: Using pgAdmin

1. Open pgAdmin
2. Connect to your database server
3. Navigate to: Databases → `sporttournament` → Functions
4. Right-click on "Functions" → Query Tool
5. Open the file `FUNCTION_FIX.sql` and copy all its contents
6. Paste into the Query Tool
7. Click "Execute" (or press F5)

### Option 3: Using a SQL File

1. Make sure you have the `FUNCTION_FIX.sql` file in your project directory
2. Run it using:
   ```bash
   psql -U postgres -d sporttournament -f FUNCTION_FIX.sql
   ```

## Verify the Function Was Created

After creating the function, verify it exists by running:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_player_current_team_info';
```

You should see one row returned.

## Test the Function

Test the function with a player ID:

```sql
SELECT * FROM get_player_current_team_info('P001');
```

Replace `'P001'` with an actual player ID from your database.

## Troubleshooting

### If you get "relation does not exist" error:
- Make sure the `PlayerTeam` and `Team` tables exist in your database
- Check that table names match exactly (case-sensitive)

### If you get "column does not exist" error:
- Verify that the `Team` table has columns: `team_id`, `team_name`, `college_id`
- Verify that the `PlayerTeam` table has columns: `player_id`, `team_id`, `joining_date`, `end_date`

### If the function returns no rows:
- The player might not be assigned to any team
- The player's team assignment might have ended (end_date is in the past)
- The player's joining_date might be in the future



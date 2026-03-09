# Sport Tournament Database Manager

A full-stack application for managing sport tournament data with React, Express.js, and PostgreSQL.

## Features

- **CRUD Operations**: Insert, Update, and Delete players
- **Complex Reporting**: Multi-department organizers and undefeated teams queries
- **PostgreSQL Functions**: Call database functions to retrieve player team and college information
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Project Structure

```
sportWeb/
├── backend/              # Express.js backend
│   ├── db/
│   │   └── db.js        # PostgreSQL connection pool
│   ├── routes/
│   │   ├── playerRoutes.js    # Player CRUD operations
│   │   ├── reportRoutes.js    # Complex reporting queries
│   │   └── functionRoutes.js  # PostgreSQL function calls
│   ├── server.js        # Express server setup
│   └── package.json
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── ReportTable.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── PlayerCrudPage.tsx
│   │   │   ├── FunctionCallPage.tsx
│   │   │   └── ReportViewPage.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── package.json
└── POSTGRES_DDL.sql     # Database schema and functions
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE sporttournament;
   ```

2. Run the DDL script to create tables and functions:
   ```bash
   psql -U postgres -d sporttournament -f POSTGRES_DDL.sql
   ```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your PostgreSQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sporttournament
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   PORT=5000
   NODE_ENV=development
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## API Endpoints

### Player CRUD Operations

- `POST /api/player` - Insert a new player (Q2)
- `PUT /api/player/:id` - Update player information (Q3)
- `DELETE /api/player/:id` - Delete a player (Q4)
- `GET /api/player/:id` - Get a single player
- `GET /api/player` - Get all players

### Reports

- `GET /api/report/multidept-organizers` - Q22: Organizers who worked in both Logistics and Marketing
- `GET /api/report/fall2024-undefeated` - Q30: Teams with win outcome in every Fall 2024 match

### Functions

- `GET /api/function/player-team-college/:id` - Q36: Get current team and college for a player

## Usage

1. Open `http://localhost:3000` in your browser
2. Navigate through the menu to access different features:
   - **Insert Player**: Add a new player to the database
   - **Update Player**: Modify player contact information and college
   - **Delete Player**: Remove a player from the database
   - **Multi-Department Organizers**: View organizers in multiple departments
   - **Fall 2024 Undefeated Teams**: View undefeated teams in Fall 2024
   - **Player Team & College**: Get current team and college information

## Technologies Used

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express.js, PostgreSQL (pg)
- **Database**: PostgreSQL 12+

## Notes

- Ensure PostgreSQL is running before starting the backend
- The database connection pool handles multiple concurrent requests
- All API endpoints use parameterized queries to prevent SQL injection
- The frontend uses Vite as the build tool for fast development

## Troubleshooting

- **Database connection errors**: Verify PostgreSQL is running and credentials in `.env` are correct
- **Port conflicts**: Change `PORT` in backend `.env` or update frontend proxy in `vite.config.ts`
- **CORS errors**: Ensure backend CORS middleware is enabled (already configured)
- **Function not found**: Make sure you've run the `POSTGRES_DDL.sql` script to create the function


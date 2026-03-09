CREATE TABLE Person (
    person_id VARCHAR(10) PRIMARY KEY,
    person_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10)
        CHECK (LOWER(gender) IN ('male', 'female', 'other')),
    dob DATE NOT NULL ,
    contact_no VARCHAR(10) NOT NULL,
    college_name VARCHAR(100),
    roles VARCHAR(50)
);
CREATE TABLE Tournament (
    tournament_id VARCHAR(10) PRIMARY KEY,
    tournament_year INT NOT NULL
        CHECK (tournament_year BETWEEN 2000 AND 2025),

    season VARCHAR(20)
        CHECK (LOWER(season) IN ('fall' , 'spring')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);


CREATE TABLE company (
    company VARCHAR(100) PRIMARY KEY,
    address VARCHAR(255) NOT NULL
);

CREATE TABLE Sponsors (
    sponsor_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(10) NOT NULL,
    company VARCHAR(100) NOT NULL,
  
CONSTRAINT chk_contact_no_digits CHECK (contact_no ~ '^[0-9]{10}$'),

    CONSTRAINT fk_company FOREIGN KEY (company)
        REFERENCES Company(company)
       ON DELETE RESTRICT
       ON UPDATE CASCADE
);



CREATE TABLE SponsorsTournament (
    tournament_id VARCHAR(10) NOT NULL,
    sponsor_id VARCHAR(10) NOT NULL,
    budget DECIMAL(12,2) NOT NULL CHECK (budget >= 0),
    PRIMARY KEY (tournament_id, sponsor_id),
    CONSTRAINT fk_tournament FOREIGN KEY (tournament_id)
        REFERENCES Tournament(tournament_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_sponsor FOREIGN KEY (sponsor_id)
        REFERENCES Sponsors(sponsor_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Sports (
    sport_id VARCHAR(10) PRIMARY KEY,
    sport_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE SportType (
    sport_name VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    CONSTRAINT fk_sport FOREIGN KEY (sport_name)
        REFERENCES Sports(sport_name)
        ON DELETE CASCADE
);


CREATE TABLE Equipments (
    equipment_id VARCHAR(10) PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    number INT NOT NULL,
   CONSTRAINT chk_number_nonnegative CHECK (number >= 0)
);


CREATE TABLE Coach (
    coach_id VARCHAR(10) PRIMARY KEY,
    coach_name VARCHAR(100) NOT NULL,
     contact_no VARCHAR(10) NOT NULL
        CHECK (contact_no ~  '^[0-9]{10}$')
);

CREATE TABLE Venue (
    venue_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255)
);

CREATE TABLE Referee (
    referee_id VARCHAR(10) PRIMARY KEY,
    referee_name VARCHAR(100) NOT NULL,
     contact_no VARCHAR(10) NOT NULL
        CHECK (contact_no ~ '^[0-9]{10}$')
    );

CREATE TABLE Organizer (
    member_id VARCHAR(10) PRIMARY KEY,
    member_name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(10) NOT NULL
        CHECK (contact_no ~ '^[0-9]{10}$')
);


CREATE TABLE Player (
    player_id VARCHAR(10) PRIMARY KEY,
    height DECIMAL(5,2) NOT NULL CHECK (height >= 0),
    weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0),
    bloodgroup VARCHAR(5) CHECK (bloodgroup IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
    joining_year INT NOT NULL CHECK (joining_year BETWEEN 2000 AND 2025),
    FOREIGN KEY (player_id) REFERENCES Person(person_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


CREATE TABLE SpectatorPass (
    spectator_id VARCHAR(10) NOT NULL,
    tournament_id VARCHAR(10) NOT NULL,
    pass_type VARCHAR(10) NOT NULL
        CHECK (LOWER(pass_type) IN ('gold','silver','regular')),
    PRIMARY KEY (spectator_id, tournament_id),
    FOREIGN KEY (spectator_id) REFERENCES Person(person_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



CREATE TABLE Team (
    team_id VARCHAR(10) PRIMARY KEY,
    sport_id VARCHAR(10) NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    college_id VARCHAR(100),
    captain_id VARCHAR(10),
    FOREIGN KEY (sport_id) REFERENCES Sports(sport_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (captain_id) REFERENCES Player(player_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT chk_team_name UNIQUE (team_name, college_id)
);


CREATE TABLE Match (
    match_id VARCHAR(10) PRIMARY KEY,
    sport_id VARCHAR(10) NOT NULL,
    tournament_id VARCHAR(10) NOT NULL,
    date DATE NOT NULL
    CHECK (date >= '2000-01-01' AND date <= CURRENT_DATE + INTERVAL '1 year'),
    match_type VARCHAR(20) NOT NULL 
        CHECK (LOWER(match_type) IN ('group', 'quarterfinal', 'semifinal', 'final')),
    time TIME NOT NULL,
    venue_id VARCHAR(10),
    referee_id VARCHAR(10),
    FOREIGN KEY (sport_id) REFERENCES Sports(sport_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES Referee(referee_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);




CREATE TABLE SportRules (
    sport_id VARCHAR(10) PRIMARY KEY,
    rules TEXT,
    FOREIGN KEY (sport_id) REFERENCES Sports(sport_id)
);

CREATE TABLE Accommodation (
    person_id VARCHAR(10) NOT NULL,
    tournament_id VARCHAR(10) NOT NULL,
    room_no VARCHAR(10) NOT NULL,
    check_in_date DATE NOT NULL CHECK (check_in_date >= '2000-01-01'),
    check_out_date DATE NOT NULL CHECK (check_out_date >= check_in_date),
    status VARCHAR(20) NOT NULL 
        CHECK (LOWER(status) IN ('booked', 'checked_in', 'checked_out', 'cancelled')),
    PRIMARY KEY (person_id, tournament_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



CREATE TABLE OrganizeTournament (
    tournament_id VARCHAR(10) NOT NULL,
    member_id VARCHAR(10) NOT NULL,
    role VARCHAR(30) NOT NULL 
        CHECK (LOWER(role) IN ('coordinator', 'manager', 'assistant', 'volunteer')),
    department VARCHAR(50) NOT NULL
        CHECK (LOWER(department) IN (
            'logistics', 'operations', 'marketing', 'finance', 
            'refereeing', 'medical', 'hospitality', 'technical', 'volunteers'
        )),
    PRIMARY KEY (tournament_id, member_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (member_id) REFERENCES Organizer(member_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE SpectatorViewMatch (
    spectator_id VARCHAR(10) NOT NULL,
    match_id VARCHAR(10) NOT NULL,
    PRIMARY KEY (spectator_id, match_id),
    FOREIGN KEY (spectator_id) REFERENCES Person(person_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (match_id) REFERENCES Match(match_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE PlayerPlaysMatch (
    player_id VARCHAR(10) NOT NULL,
    match_id VARCHAR(10) NOT NULL,
    PRIMARY KEY (player_id, match_id),
    FOREIGN KEY (player_id) REFERENCES Player(player_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (match_id) REFERENCES Match(match_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE SportEquipments (
    sport_id VARCHAR(10) NOT NULL,
    equipment_id VARCHAR(10) NOT NULL,
    number INT NOT NULL CHECK (number >= 0),
    PRIMARY KEY (sport_id, equipment_id),
    FOREIGN KEY (sport_id) REFERENCES Sports(sport_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES Equipments(equipment_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE PlayerSport (
    player_id VARCHAR(10) NOT NULL,
    sport_id VARCHAR(10) NOT NULL,
    level VARCHAR(20) NOT NULL 
        CHECK (LOWER(level) IN ('beginner', 'intermediate', 'advanced', 'professional')),
    experience_years INT NOT NULL CHECK (experience_years >= 0),
    PRIMARY KEY (player_id, sport_id),
    FOREIGN KEY (player_id) REFERENCES Player(player_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES Sports(sport_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);




CREATE TABLE PlayerTeam (
    player_id VARCHAR(10) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    joining_date DATE NOT NULL CHECK (joining_date >= '2000-01-01'),
    end_date DATE CHECK (end_date IS NULL OR end_date >= joining_date),
    PRIMARY KEY (player_id, team_id),
    FOREIGN KEY (player_id) REFERENCES Player(player_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


 
CREATE TABLE TeamPlaysMatch (
    match_id VARCHAR(10) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    PRIMARY KEY (match_id, team_id),
    FOREIGN KEY (match_id) REFERENCES Match(match_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



CREATE TABLE TeamCoach (
    team_id VARCHAR(10) NOT NULL,
    coach_id VARCHAR(10) NOT NULL,
    join_date DATE NOT NULL CHECK (join_date >= '2000-01-01'),
    end_date DATE CHECK (end_date IS NULL OR end_date >= join_date),
    PRIMARY KEY (team_id, coach_id),
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES Coach(coach_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


CREATE TABLE PlayerStatistics (
    player_id VARCHAR(10) NOT NULL,
    match_id VARCHAR(10) NOT NULL,
    status_name VARCHAR(20) NOT NULL, 
    score INT NOT NULL CHECK (score >= 0),
    PRIMARY KEY (player_id, match_id, status_name),
    FOREIGN KEY (player_id) REFERENCES Player(player_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (match_id) REFERENCES Match(match_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE TeamStatistics (
    team_id VARCHAR(10) NOT NULL,
    match_id VARCHAR(10) NOT NULL,
    status_name VARCHAR(20) NOT NULL,
    score INT NOT NULL CHECK (score >= 0),
    PRIMARY KEY (team_id, match_id, status_name),
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (match_id) REFERENCES Match(match_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Result (
    match_id VARCHAR(10) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    outcome VARCHAR(10) NOT NULL 
        CHECK (LOWER(outcome) IN ('win','loss','draw')),
    PRIMARY KEY (match_id, team_id),
    FOREIGN KEY (match_id) REFERENCES Match(match_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

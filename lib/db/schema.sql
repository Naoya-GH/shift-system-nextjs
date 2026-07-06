CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT '',
    role         TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
    password     TEXT NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_requests (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    month      TEXT NOT NULL,
    work_date  TEXT NOT NULL,
    slot       TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL CHECK (status IN ('ok', 'maybe')),
    start_time TEXT NOT NULL DEFAULT '',
    end_time   TEXT NOT NULL DEFAULT '',
    memo       TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, work_date, slot)
);

CREATE TABLE IF NOT EXISTS shifts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    work_date  TEXT NOT NULL,
    confirmed  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, work_date)
);

CREATE TABLE IF NOT EXISTS day_labels (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    work_date  TEXT NOT NULL,
    type       TEXT NOT NULL CHECK (type IN ('lunch', 'obanzai', 'custom')),
    label      TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (work_date, type)
);

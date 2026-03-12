-- V2: Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id            UUID             NOT NULL DEFAULT gen_random_uuid(),
    citizen_name  VARCHAR(255)     NOT NULL,
    incident_type VARCHAR(50)      NOT NULL,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    notes         TEXT,
    created_by    UUID             NOT NULL,
    assigned_unit UUID,
    status        VARCHAR(50)      NOT NULL DEFAULT 'CREATED',
    created_at    TIMESTAMP                 DEFAULT now(),

    CONSTRAINT pk_incidents PRIMARY KEY (id),
    CONSTRAINT chk_incidents_type CHECK (incident_type IN (
        'ROBBERY', 'CRIME', 'FIRE', 'MEDICAL_EMERGENCY'
    )),
    CONSTRAINT chk_incidents_status CHECK (status IN (
        'CREATED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED'
    )),
    CONSTRAINT fk_incidents_responder FOREIGN KEY (assigned_unit)
        REFERENCES responders (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_type   ON incidents (incident_type);

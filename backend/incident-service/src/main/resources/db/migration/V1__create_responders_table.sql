-- V1: Create responders table (police stations, fire stations, ambulances)
CREATE TABLE IF NOT EXISTS responders (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    name           VARCHAR(255) NOT NULL,
    responder_type VARCHAR(50)  NOT NULL,
    latitude       DOUBLE PRECISION NOT NULL,
    longitude      DOUBLE PRECISION NOT NULL,
    available      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_responders PRIMARY KEY (id),
    CONSTRAINT chk_responders_type CHECK (responder_type IN ('POLICE', 'FIRE', 'AMBULANCE'))
);

CREATE INDEX IF NOT EXISTS idx_responders_type     ON responders (responder_type);
CREATE INDEX IF NOT EXISTS idx_responders_available ON responders (available);

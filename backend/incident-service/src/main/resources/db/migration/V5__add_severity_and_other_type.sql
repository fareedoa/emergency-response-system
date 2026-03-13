-- Add new fields to incidents table
ALTER TABLE incidents
ADD COLUMN severity VARCHAR(50),
ADD COLUMN other_incident_type VARCHAR(255);

-- Create Envers revinfo table
CREATE TABLE revinfo (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    username VARCHAR(255)
);

-- Create audit table for incidents
CREATE TABLE incidents_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    citizen_name VARCHAR(255),
    incident_type VARCHAR(255),
    other_incident_type VARCHAR(255),
    severity VARCHAR(50),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notes TEXT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    assigned_unit UUID,
    status VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_incidents_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
);

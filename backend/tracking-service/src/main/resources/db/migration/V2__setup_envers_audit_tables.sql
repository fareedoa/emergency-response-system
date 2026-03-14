-- Create Envers revinfo table
CREATE TABLE revinfo (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    username VARCHAR(255)
);

-- Create audit table for vehicles
CREATE TABLE vehicles_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    registration VARCHAR(20),
    vehicle_type VARCHAR(50),
    station_id UUID,
    station_type VARCHAR(50),
    driver_user_id UUID,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    status VARCHAR(50),
    active_incident_id VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_vehicles_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
);

-- Create audit table for vehicle_locations
CREATE TABLE vehicle_locations_aud (
    id BIGINT NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    vehicle_id UUID,
    incident_id VARCHAR(50),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed_kmh NUMERIC(5,2),
    heading NUMERIC(5,2),
    recorded_at TIMESTAMPTZ,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_vehicle_locations_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
);

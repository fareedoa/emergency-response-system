CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    station_id UUID NOT NULL,
    station_type VARCHAR(50) NOT NULL,
    driver_user_id UUID,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL,
    active_incident_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Note: In a production environment, an extension like pg_partman would be used to automatically 
-- create daily partitions and archive partitions older than 90 days to cold storage to maintain 
-- consistent query performance.

CREATE TABLE IF NOT EXISTS vehicle_locations (
    id BIGSERIAL,
    vehicle_id UUID NOT NULL,
    incident_id VARCHAR(50),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed_kmh NUMERIC(5,2),
    heading NUMERIC(5,2),
    recorded_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, recorded_at),
    CONSTRAINT fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) PARTITION BY RANGE (recorded_at);

-- Create a few initial partitions for testing (e.g., current and next few months)
CREATE TABLE vehicle_locations_y2026m03 PARTITION OF vehicle_locations
    FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');

CREATE TABLE vehicle_locations_y2026m04 PARTITION OF vehicle_locations
    FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');

CREATE TABLE vehicle_locations_y2026m05 PARTITION OF vehicle_locations
    FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

-- Create a default partition for data falling outside the defined ranges
CREATE TABLE vehicle_locations_default PARTITION OF vehicle_locations DEFAULT;

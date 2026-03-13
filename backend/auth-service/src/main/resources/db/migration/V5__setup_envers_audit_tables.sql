-- Create Envers revinfo table
CREATE TABLE revinfo (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    username VARCHAR(255)
);

-- Create audit table for users
CREATE TABLE users_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    name VARCHAR(255),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50),
    enabled BOOLEAN,
    created_date TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    last_login TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_users_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
);

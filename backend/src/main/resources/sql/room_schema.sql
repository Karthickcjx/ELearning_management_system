-- Apply manually in production environments where DDL auto-generation is disabled.
CREATE TABLE IF NOT EXISTS room_session (
    id BINARY(16) NOT NULL,
    topic VARCHAR(160) NULL,
    skill_band INT NOT NULL,
    avg_skill_score DOUBLE NOT NULL,
    group_size INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL,
    started_at DATETIME(6) NOT NULL,
    ended_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_room_session_status_created (status, created_at),
    INDEX idx_room_session_band (skill_band)
);

CREATE TABLE IF NOT EXISTS room_participant (
    id BIGINT NOT NULL AUTO_INCREMENT,
    session_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    skill_score DOUBLE NOT NULL,
    skill_band INT NOT NULL,
    joined_at DATETIME(6) NOT NULL,
    left_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_room_participant_session (session_id),
    INDEX idx_room_participant_user (user_id),
    CONSTRAINT fk_room_participant_session FOREIGN KEY (session_id) REFERENCES room_session (id),
    CONSTRAINT fk_room_participant_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS room_chat_message (
    id BIGINT NOT NULL AUTO_INCREMENT,
    session_id BINARY(16) NOT NULL,
    sender_user_id BINARY(16) NULL,
    sender_name VARCHAR(120) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_room_chat_session_created (session_id, created_at),
    CONSTRAINT fk_room_chat_session FOREIGN KEY (session_id) REFERENCES room_session (id),
    CONSTRAINT fk_room_chat_sender_user FOREIGN KEY (sender_user_id) REFERENCES users (id)
);


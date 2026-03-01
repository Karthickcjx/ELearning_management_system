-- Apply manually in production environments where DDL auto-generation is disabled.
CREATE TABLE IF NOT EXISTS ai_session (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    course_id BINARY(16) NULL,
    lesson_id VARCHAR(120) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    started_at DATETIME(6) NOT NULL,
    last_activity_at DATETIME(6) NOT NULL,
    ended_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_ai_session_user_last (user_id, last_activity_at),
    INDEX idx_ai_session_course (course_id),
    CONSTRAINT fk_ai_session_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_ai_session_course FOREIGN KEY (course_id) REFERENCES course (course_id)
);

CREATE TABLE IF NOT EXISTS ai_message (
    id BIGINT NOT NULL AUTO_INCREMENT,
    session_id BINARY(16) NOT NULL,
    sender VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    latency_ms INT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_ai_message_session_created (session_id, created_at),
    CONSTRAINT fk_ai_message_session FOREIGN KEY (session_id) REFERENCES ai_session (id)
);

CREATE TABLE IF NOT EXISTS ai_recommendation (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BINARY(16) NOT NULL,
    course_id BINARY(16) NOT NULL,
    lesson_id VARCHAR(120) NULL,
    score DECIMAL(5,4) NOT NULL,
    reason VARCHAR(512) NOT NULL,
    model_version VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_ai_reco_user_course (user_id, course_id, created_at),
    CONSTRAINT fk_ai_reco_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_ai_reco_course FOREIGN KEY (course_id) REFERENCES course (course_id)
);

CREATE TABLE IF NOT EXISTS ai_feedback (
    id BIGINT NOT NULL AUTO_INCREMENT,
    message_id BIGINT NOT NULL,
    user_id BINARY(16) NOT NULL,
    vote TINYINT NOT NULL,
    comment VARCHAR(1000) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_ai_feedback_message (message_id),
    CONSTRAINT fk_ai_feedback_message FOREIGN KEY (message_id) REFERENCES ai_message (id),
    CONSTRAINT fk_ai_feedback_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS ai_usage_daily (
    id BIGINT NOT NULL AUTO_INCREMENT,
    usage_date DATE NOT NULL,
    user_id BINARY(16) NOT NULL,
    request_count INT NOT NULL DEFAULT 0,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ai_usage_daily (usage_date, user_id),
    CONSTRAINT fk_ai_usage_user FOREIGN KEY (user_id) REFERENCES users (id)
);


CREATE TABLE IF NOT EXISTS course_reviews (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    course_id BINARY(16) NOT NULL,
    rating INT NOT NULL,
    review_text VARCHAR(500),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    PRIMARY KEY (id),
    CONSTRAINT uk_course_reviews_user_course UNIQUE (user_id, course_id),
    CONSTRAINT fk_course_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_course_reviews_course FOREIGN KEY (course_id) REFERENCES course(course_id),
    CONSTRAINT chk_course_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_user ON course_reviews(user_id);
CREATE INDEX idx_course_reviews_rating ON course_reviews(rating);
CREATE INDEX idx_course_reviews_created_at ON course_reviews(created_at);

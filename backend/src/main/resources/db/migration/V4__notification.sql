-- Notification Table

CREATE TABLE system_notification (
    seq_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content VARCHAR(2000),
    noti_type VARCHAR(20) NOT NULL CHECK (noti_type IN ('NOTICE', 'EVENT', 'MAINTENANCE', 'ALERT')),
    start_date TIMESTAMP(6),
    end_date TIMESTAMP(6),
    use_yn CHAR(1) DEFAULT 'Y',
    created_by BIGINT,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

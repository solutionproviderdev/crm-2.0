-- Create custom ENUM types for statuses (if they do not already exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_status_enum') THEN
        CREATE TYPE employment_status_enum AS ENUM (
            'trainee',
            'probationary',
            'permanent',
            'contract',
            'part_time',
            'internship',
            'resigned',
            'terminated',
            'retired',
            'suspended',
            'on_notice_period',
            'absconded',
            'deceased',
            'transferred',
            'deputed'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
        CREATE TYPE account_status_enum AS ENUM (
            'active',
            'inactive',
            'pending',
            'locked',
            'archived'
        );
    END IF;
END $$;

-- Add columns to users table and drop the old status column
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS employment_status employment_status_enum NOT NULL DEFAULT 'trainee',
    ADD COLUMN IF NOT EXISTS account_status account_status_enum NOT NULL DEFAULT 'active';

-- NOTE: Dropping old generic 'status' field as per deprecation decision.
-- IF data exists in 'status', you may want to migrate it first before dropping.
-- For example: UPDATE users SET account_status = 'inactive' WHERE status = 'Inactive';
ALTER TABLE users DROP COLUMN IF EXISTS status;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_employment_status ON users(employment_status);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);


-- =========================================================================
-- ROLLBACK SCRIPT (Commented out)
-- =========================================================================
/*
-- 1. Restore the generic status column
ALTER TABLE users ADD COLUMN status text DEFAULT 'Active';

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_users_account_status;
DROP INDEX IF EXISTS idx_users_employment_status;

-- 3. Drop columns
ALTER TABLE users 
    DROP COLUMN IF EXISTS account_status,
    DROP COLUMN IF EXISTS employment_status;

-- 4. Drop the ENUM types
DROP TYPE IF EXISTS account_status_enum;
DROP TYPE IF EXISTS employment_status_enum;
*/

-- Function to check if all required platform posts are published
CREATE OR REPLACE FUNCTION check_job_completion()
RETURNS TRIGGER AS $$
DECLARE
    required_count INT;
    published_count INT;
BEGIN
    -- Only act if the status was changed to 'published'
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status <> 'published') THEN
        -- Find how many "required" platform posts exist for this job
        -- We define required as 'linkedin' and 'email' (newsletter)
        SELECT COUNT(*) INTO required_count
        FROM platform_posts
        WHERE job_id = NEW.job_id
        AND platform IN ('linkedin', 'email');

        -- Count how many of these are actually 'published'
        SELECT COUNT(*) INTO published_count
        FROM platform_posts
        WHERE job_id = NEW.job_id
        AND platform IN ('linkedin', 'email')
        AND status = 'published';

        -- If all required posts are published, mark the job as published
        IF required_count > 0 AND required_count = published_count THEN
            UPDATE content_jobs
            SET status = 'published'
            WHERE id = NEW.job_id
            AND status <> 'published';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run after any status update on platform_posts
DROP TRIGGER IF EXISTS on_post_published ON platform_posts;
CREATE TRIGGER on_post_published
AFTER UPDATE ON platform_posts
FOR EACH ROW
EXECUTE FUNCTION check_job_completion();

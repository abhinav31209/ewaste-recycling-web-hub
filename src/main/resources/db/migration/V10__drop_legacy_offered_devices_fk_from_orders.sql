DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT c.conname
    INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class source_table ON source_table.oid = c.conrelid
    JOIN pg_class target_table ON target_table.oid = c.confrelid
    WHERE c.contype = 'f'
      AND source_table.relname = 'orders'
      AND target_table.relname = 'offered_devices'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

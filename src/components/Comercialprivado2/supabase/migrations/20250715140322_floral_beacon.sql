-- Add unique constraint on config_type column for system_configurations table
-- This constraint is required for upsert operations with ON CONFLICT

-- Create unique constraint on config_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'system_configurations_config_type_key'
    ) THEN
        ALTER TABLE public.system_configurations 
        ADD CONSTRAINT system_configurations_config_type_key UNIQUE (config_type);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_system_configurations_config_type 
ON public.system_configurations (config_type);
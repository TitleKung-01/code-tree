-- =============================================
-- Helper function: auto-update updated_at
-- ใช้กับทุก table ที่มี updated_at column
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
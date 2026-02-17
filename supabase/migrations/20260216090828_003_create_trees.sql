-- =============================================
-- Trees Table
-- แต่ละ tree คือ "สายรหัส" หนึ่งสาย
-- ต้องสร้างก่อน nodes เพราะ nodes reference trees
-- =============================================

CREATE TABLE public.trees (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    description  TEXT DEFAULT '',
    faculty      TEXT DEFAULT '',
    department   TEXT DEFAULT '',
    created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_token  TEXT UNIQUE DEFAULT NULL,
    is_public    BOOLEAN NOT NULL DEFAULT FALSE,
    -- โครงสร้าง parent-child ทั้ง tree เก็บเป็น JSONB
    -- format: { "rootIds": ["uuid"], "edges": { "uuid": { "children": ["uuid"], "order": 0 } } }
    structure    JSONB NOT NULL DEFAULT '{"rootIds":[],"edges":{}}'::jsonb,
    settings     JSONB NOT NULL DEFAULT '{
        "layout_direction": "vertical",
        "theme": "default",
        "show_photos": true,
        "show_student_id": true
    }'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trees_created_by ON public.trees(created_by);
CREATE INDEX idx_trees_share_token ON public.trees(share_token) WHERE share_token IS NOT NULL;

-- Enable RLS
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER trees_updated_at
    BEFORE UPDATE ON public.trees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();
-- =============================================
-- Nodes Table
-- แต่ละ node คือ "คน" หนึ่งคนในสายรหัส
-- เก็บเฉพาะข้อมูลคน ไม่เก็บ hierarchy
-- (hierarchy อยู่ใน trees.structure JSONB)
-- =============================================

-- Status enum
CREATE TYPE public.node_status AS ENUM (
    'studying',
    'graduated',
    'retired'
);

CREATE TABLE public.nodes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id        UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
    nickname       TEXT NOT NULL,
    first_name     TEXT DEFAULT '',
    last_name      TEXT DEFAULT '',
    student_id     TEXT DEFAULT NULL,
    photo_url      TEXT DEFAULT '',
    status         public.node_status NOT NULL DEFAULT 'studying',
    position_x     DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y     DOUBLE PRECISION NOT NULL DEFAULT 0,
    metadata       JSONB DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- เช็คซ้ำ student_id ต่อ tree (NULL ไม่ชนกัน — สร้างได้หลาย node ที่ไม่กรอกรหัส)
CREATE UNIQUE INDEX unique_student_id_per_tree
    ON public.nodes (tree_id, student_id)
    WHERE student_id IS NOT NULL;

-- Indexes
CREATE INDEX idx_nodes_tree_id ON public.nodes(tree_id);

-- Full-text search index
CREATE INDEX idx_nodes_search ON public.nodes
    USING GIN (to_tsvector('simple', nickname || ' ' || first_name || ' ' || last_name));

-- Enable RLS
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER nodes_updated_at
    BEFORE UPDATE ON public.nodes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

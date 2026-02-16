-- =============================================
-- Nodes Table
-- แต่ละ node คือ "คน" หนึ่งคนในสายรหัส
-- ต้องสร้างหลัง trees เพราะ REFERENCES public.trees(id)
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
    parent_id      UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
    sibling_order  INT NOT NULL DEFAULT 0,
    nickname       TEXT NOT NULL,
    first_name     TEXT DEFAULT '',
    last_name      TEXT DEFAULT '',
    student_id     TEXT DEFAULT '',
    generation     INT NOT NULL DEFAULT 1,
    photo_url      TEXT DEFAULT '',
    status         public.node_status NOT NULL DEFAULT 'studying',
    position_x     DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y     DOUBLE PRECISION NOT NULL DEFAULT 0,
    metadata       JSONB DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_id_per_tree UNIQUE (tree_id, student_id)
);

-- Indexes
CREATE INDEX idx_nodes_tree_id ON public.nodes(tree_id);
CREATE INDEX idx_nodes_parent_id ON public.nodes(parent_id);
CREATE INDEX idx_nodes_tree_parent ON public.nodes(tree_id, parent_id);
CREATE INDEX idx_nodes_tree_generation ON public.nodes(tree_id, generation);

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
-- =============================================
-- Tree Shares Table
-- ระบบแชร์สายรหัส: กำหนดสิทธิ์ View / Edit / Owner
-- =============================================

-- Role enum
CREATE TYPE public.share_role AS ENUM (
    'viewer',
    'editor',
    'owner'
);

CREATE TABLE public.tree_shares (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id      UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role         public.share_role NOT NULL DEFAULT 'viewer',
    invited_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ห้ามแชร์ซ้ำ: user เดียวกันกับ tree เดียวกัน
CREATE UNIQUE INDEX unique_tree_share_per_user
    ON public.tree_shares (tree_id, user_id);

-- Indexes
CREATE INDEX idx_tree_shares_tree_id ON public.tree_shares(tree_id);
CREATE INDEX idx_tree_shares_user_id ON public.tree_shares(user_id);

-- Enable RLS
ALTER TABLE public.tree_shares ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER tree_shares_updated_at
    BEFORE UPDATE ON public.tree_shares
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- RLS Policies for tree_shares
-- =============================================

-- อ่านรายการแชร์ได้ถ้า: เป็นเจ้าของ tree หรือเป็นคนที่ถูกแชร์
CREATE POLICY "tree_shares_select"
    ON public.tree_shares FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = tree_shares.tree_id
            AND trees.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.tree_shares ts2
            WHERE ts2.tree_id = tree_shares.tree_id
            AND ts2.user_id = auth.uid()
            AND ts2.role = 'owner'
        )
    );

-- เพิ่มแชร์ได้เฉพาะ: เจ้าของ tree หรือ co-owner
CREATE POLICY "tree_shares_insert"
    ON public.tree_shares FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = tree_shares.tree_id
            AND trees.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.tree_shares ts2
            WHERE ts2.tree_id = tree_shares.tree_id
            AND ts2.user_id = auth.uid()
            AND ts2.role = 'owner'
        )
    );

-- แก้ไขแชร์ได้เฉพาะ: เจ้าของ tree หรือ co-owner
CREATE POLICY "tree_shares_update"
    ON public.tree_shares FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = tree_shares.tree_id
            AND trees.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.tree_shares ts2
            WHERE ts2.tree_id = tree_shares.tree_id
            AND ts2.user_id = auth.uid()
            AND ts2.role = 'owner'
        )
    );

-- ลบแชร์ได้เฉพาะ: เจ้าของ tree, co-owner, หรือตัวเอง (ออกจากแชร์)
CREATE POLICY "tree_shares_delete"
    ON public.tree_shares FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = tree_shares.tree_id
            AND trees.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.tree_shares ts2
            WHERE ts2.tree_id = tree_shares.tree_id
            AND ts2.user_id = auth.uid()
            AND ts2.role = 'owner'
        )
    );

-- =============================================
-- อัปเดต RLS Policies ให้รองรับ tree_shares
-- =============================================

-- =============================================
-- Trees: อัปเดต SELECT ให้คนที่ถูกแชร์เข้าถึงได้
-- =============================================

DROP POLICY IF EXISTS "trees_select" ON public.trees;
CREATE POLICY "trees_select"
    ON public.trees FOR SELECT
    USING (
        created_by = auth.uid()
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM public.tree_shares
            WHERE tree_shares.tree_id = trees.id
            AND tree_shares.user_id = auth.uid()
        )
    );

-- อัปเดต UPDATE: เจ้าของ + editor/owner ที่ถูกแชร์
DROP POLICY IF EXISTS "trees_update" ON public.trees;
CREATE POLICY "trees_update"
    ON public.trees FOR UPDATE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.tree_shares
            WHERE tree_shares.tree_id = trees.id
            AND tree_shares.user_id = auth.uid()
            AND tree_shares.role IN ('editor', 'owner')
        )
    )
    WITH CHECK (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.tree_shares
            WHERE tree_shares.tree_id = trees.id
            AND tree_shares.user_id = auth.uid()
            AND tree_shares.role IN ('editor', 'owner')
        )
    );

-- =============================================
-- Nodes: อัปเดตให้คนที่ถูกแชร์เข้าถึงได้ตามสิทธิ์
-- =============================================

-- SELECT: เจ้าของ tree + ถูกแชร์ (ทุก role) + public
DROP POLICY IF EXISTS "nodes_select" ON public.nodes;
CREATE POLICY "nodes_select"
    ON public.nodes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = nodes.tree_id
            AND (
                trees.created_by = auth.uid()
                OR trees.is_public = true
                OR EXISTS (
                    SELECT 1 FROM public.tree_shares
                    WHERE tree_shares.tree_id = trees.id
                    AND tree_shares.user_id = auth.uid()
                )
            )
        )
    );

-- INSERT: เจ้าของ tree + editor/owner ที่ถูกแชร์
DROP POLICY IF EXISTS "nodes_insert" ON public.nodes;
CREATE POLICY "nodes_insert"
    ON public.nodes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = nodes.tree_id
            AND (
                trees.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.tree_shares
                    WHERE tree_shares.tree_id = trees.id
                    AND tree_shares.user_id = auth.uid()
                    AND tree_shares.role IN ('editor', 'owner')
                )
            )
        )
    );

-- UPDATE: เจ้าของ tree + editor/owner ที่ถูกแชร์
DROP POLICY IF EXISTS "nodes_update" ON public.nodes;
CREATE POLICY "nodes_update"
    ON public.nodes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = nodes.tree_id
            AND (
                trees.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.tree_shares
                    WHERE tree_shares.tree_id = trees.id
                    AND tree_shares.user_id = auth.uid()
                    AND tree_shares.role IN ('editor', 'owner')
                )
            )
        )
    );

-- DELETE: เจ้าของ tree + editor/owner ที่ถูกแชร์
DROP POLICY IF EXISTS "nodes_delete" ON public.nodes;
CREATE POLICY "nodes_delete"
    ON public.nodes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = nodes.tree_id
            AND (
                trees.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.tree_shares
                    WHERE tree_shares.tree_id = trees.id
                    AND tree_shares.user_id = auth.uid()
                    AND tree_shares.role IN ('editor', 'owner')
                )
            )
        )
    );

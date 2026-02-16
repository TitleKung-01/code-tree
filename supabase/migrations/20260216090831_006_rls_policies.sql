-- =============================================
-- RLS Policies for profiles
-- =============================================

-- ใครก็อ่าน profiles ได้
CREATE POLICY "profiles_select_all"
    ON public.profiles FOR SELECT
    USING (true);

-- แก้ไขได้เฉพาะ profile ตัวเอง
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS Policies for trees
-- =============================================

-- อ่าน tree ได้ถ้า: เป็นเจ้าของ หรือ tree เป็น public
CREATE POLICY "trees_select"
    ON public.trees FOR SELECT
    USING (created_by = auth.uid() OR is_public = true);

-- สร้าง tree ได้เฉพาะ authenticated users
CREATE POLICY "trees_insert"
    ON public.trees FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- แก้ไข tree ได้เฉพาะเจ้าของ
CREATE POLICY "trees_update"
    ON public.trees FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- ลบ tree ได้เฉพาะเจ้าของ
CREATE POLICY "trees_delete"
    ON public.trees FOR DELETE
    USING (auth.uid() = created_by);

-- =============================================
-- RLS Policies for nodes
-- =============================================

-- อ่าน nodes ได้ถ้า: เข้าถึง tree ของมันได้
CREATE POLICY "nodes_select"
    ON public.nodes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = nodes.tree_id
            AND (trees.created_by = auth.uid() OR trees.is_public = true)
        )
    );

-- สร้าง nodes ได้ถ้า: เป็นเจ้าของ tree
CREATE POLICY "nodes_insert"
    ON public.nodes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = nodes.tree_id
            AND trees.created_by = auth.uid()
        )
    );

-- แก้ไข nodes ได้ถ้า: เป็นเจ้าของ tree
CREATE POLICY "nodes_update"
    ON public.nodes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = nodes.tree_id
            AND trees.created_by = auth.uid()
        )
    );

-- ลบ nodes ได้ถ้า: เป็นเจ้าของ tree
CREATE POLICY "nodes_delete"
    ON public.nodes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.trees
            WHERE trees.id = nodes.tree_id
            AND trees.created_by = auth.uid()
        )
    );
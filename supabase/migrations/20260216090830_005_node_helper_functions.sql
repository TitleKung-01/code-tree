-- =============================================
-- Helper function: ดึง descendants ของ node
-- ต้องสร้างหลัง nodes table
-- =============================================

CREATE OR REPLACE FUNCTION public.get_descendants(node_uuid UUID)
RETURNS SETOF public.nodes AS $$
    WITH RECURSIVE descendants AS (
        -- Base case: children ตรง
        SELECT n.*
        FROM public.nodes n
        WHERE n.parent_id = node_uuid

        UNION ALL

        -- Recursive: children ของ children
        SELECT n.*
        FROM public.nodes n
        INNER JOIN descendants d ON n.parent_id = d.id
    )
    SELECT * FROM descendants;
$$ LANGUAGE sql STABLE;

-- =============================================
-- Helper function: ดึง ancestors ของ node
-- =============================================

CREATE OR REPLACE FUNCTION public.get_ancestors(node_uuid UUID)
RETURNS SETOF public.nodes AS $$
    WITH RECURSIVE ancestors AS (
        -- Base case: parent ตรง
        SELECT n.*
        FROM public.nodes n
        WHERE n.id = (SELECT parent_id FROM public.nodes WHERE id = node_uuid)

        UNION ALL

        -- Recursive: parent ของ parent
        SELECT n.*
        FROM public.nodes n
        INNER JOIN ancestors a ON n.id = a.parent_id
    )
    SELECT * FROM ancestors;
$$ LANGUAGE sql STABLE;
-- =============================================
-- Helper: เพิ่ม node เข้า tree structure
-- เพิ่ม node_id เป็น child ของ parent_id (หรือเป็น root ถ้า parent_id = NULL)
-- =============================================

CREATE OR REPLACE FUNCTION public.add_node_to_structure(
    p_tree_id UUID,
    p_node_id UUID,
    p_parent_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_structure JSONB;
    v_children JSONB;
BEGIN
    SELECT structure INTO v_structure FROM public.trees WHERE id = p_tree_id;

    -- เพิ่ม edge สำหรับ node ใหม่ (ยังไม่มี children)
    v_structure := jsonb_set(
        v_structure,
        ARRAY['edges', p_node_id::text],
        '{"children":[],"order":0}'::jsonb
    );

    IF p_parent_id IS NULL THEN
        -- เป็น root node: เพิ่มเข้า rootIds
        v_structure := jsonb_set(
            v_structure,
            '{rootIds}',
            (v_structure->'rootIds') || to_jsonb(p_node_id::text)
        );
    ELSE
        -- เป็น child: เพิ่มเข้า children ของ parent
        v_children := v_structure->'edges'->p_parent_id::text->'children';
        v_structure := jsonb_set(
            v_structure,
            ARRAY['edges', p_parent_id::text, 'children'],
            v_children || to_jsonb(p_node_id::text)
        );
    END IF;

    -- อัพเดท structure กลับ
    UPDATE public.trees SET structure = v_structure WHERE id = p_tree_id;

    RETURN v_structure;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Helper: ลบ node ออกจาก tree structure
-- ลบ node_id และย้าย children ขึ้นไปอยู่กับ parent
-- =============================================

CREATE OR REPLACE FUNCTION public.remove_node_from_structure(
    p_tree_id UUID,
    p_node_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_structure JSONB;
    v_parent_id TEXT;
    v_children JSONB;
    v_node_children JSONB;
    v_edge_key TEXT;
    v_edge_val JSONB;
    v_new_edges JSONB;
BEGIN
    SELECT structure INTO v_structure FROM public.trees WHERE id = p_tree_id;

    -- หา children ของ node ที่จะลบ
    v_node_children := COALESCE(v_structure->'edges'->p_node_id::text->'children', '[]'::jsonb);

    -- หา parent ของ node (ไล่หาใน edges ว่าใครมี node นี้เป็น child)
    v_parent_id := NULL;
    FOR v_edge_key, v_edge_val IN SELECT * FROM jsonb_each(v_structure->'edges')
    LOOP
        IF v_edge_val->'children' ? p_node_id::text THEN
            v_parent_id := v_edge_key;
            EXIT;
        END IF;
    END LOOP;

    IF v_parent_id IS NOT NULL THEN
        -- ลบ node ออกจาก children ของ parent แล้วเพิ่ม children ของ node เข้าไปแทน
        v_children := (v_structure->'edges'->v_parent_id->'children') - p_node_id::text;
        v_children := v_children || v_node_children;
        v_structure := jsonb_set(
            v_structure,
            ARRAY['edges', v_parent_id, 'children'],
            v_children
        );
    ELSE
        -- node เป็น root: ลบออกจาก rootIds แล้วเพิ่ม children เป็น root แทน
        v_structure := jsonb_set(
            v_structure,
            '{rootIds}',
            ((v_structure->'rootIds') - p_node_id::text) || v_node_children
        );
    END IF;

    -- ลบ edge ของ node
    v_structure := v_structure #- ARRAY['edges', p_node_id::text];

    UPDATE public.trees SET structure = v_structure WHERE id = p_tree_id;

    RETURN v_structure;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Helper: ย้าย node ไปอยู่ parent ใหม่
-- =============================================

CREATE OR REPLACE FUNCTION public.move_node_in_structure(
    p_tree_id UUID,
    p_node_id UUID,
    p_new_parent_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_structure JSONB;
    v_old_parent_id TEXT;
    v_edge_key TEXT;
    v_edge_val JSONB;
    v_children JSONB;
BEGIN
    SELECT structure INTO v_structure FROM public.trees WHERE id = p_tree_id;

    -- หา parent เดิม
    v_old_parent_id := NULL;
    FOR v_edge_key, v_edge_val IN SELECT * FROM jsonb_each(v_structure->'edges')
    LOOP
        IF v_edge_val->'children' ? p_node_id::text THEN
            v_old_parent_id := v_edge_key;
            EXIT;
        END IF;
    END LOOP;

    -- ลบจาก parent เดิม
    IF v_old_parent_id IS NOT NULL THEN
        v_children := (v_structure->'edges'->v_old_parent_id->'children') - p_node_id::text;
        v_structure := jsonb_set(
            v_structure,
            ARRAY['edges', v_old_parent_id, 'children'],
            v_children
        );
    ELSE
        -- ลบจาก rootIds
        v_structure := jsonb_set(
            v_structure,
            '{rootIds}',
            (v_structure->'rootIds') - p_node_id::text
        );
    END IF;

    -- เพิ่มเข้า parent ใหม่
    IF p_new_parent_id IS NULL THEN
        v_structure := jsonb_set(
            v_structure,
            '{rootIds}',
            (v_structure->'rootIds') || to_jsonb(p_node_id::text)
        );
    ELSE
        v_children := v_structure->'edges'->p_new_parent_id::text->'children';
        v_structure := jsonb_set(
            v_structure,
            ARRAY['edges', p_new_parent_id::text, 'children'],
            v_children || to_jsonb(p_node_id::text)
        );
    END IF;

    UPDATE public.trees SET structure = v_structure WHERE id = p_tree_id;

    RETURN v_structure;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

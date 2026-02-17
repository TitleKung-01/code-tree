-- =============================================
-- Helper: เพิ่ม node เป็น child ของ parent (ไม่ลบจาก parent เดิม)
-- รองรับ multi-parent (DAG)
-- =============================================

CREATE OR REPLACE FUNCTION public.add_child_to_parent(
    p_tree_id UUID,
    p_node_id UUID,
    p_parent_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_structure JSONB;
    v_children JSONB;
BEGIN
    SELECT structure INTO v_structure FROM public.trees WHERE id = p_tree_id;

    -- เช็คว่า node อยู่ใน children ของ parent นี้แล้วหรือยัง
    v_children := COALESCE(v_structure->'edges'->p_parent_id::text->'children', '[]'::jsonb);
    IF v_children ? p_node_id::text THEN
        -- มีอยู่แล้ว ไม่ต้องเพิ่ม
        RETURN v_structure;
    END IF;

    -- เพิ่ม node เข้า children ของ parent
    v_structure := jsonb_set(
        v_structure,
        ARRAY['edges', p_parent_id::text, 'children'],
        v_children || to_jsonb(p_node_id::text)
    );

    -- ลบ node จาก rootIds (ถ้ามี เพราะตอนนี้มี parent แล้ว)
    IF v_structure->'rootIds' ? p_node_id::text THEN
        v_structure := jsonb_set(
            v_structure,
            '{rootIds}',
            (v_structure->'rootIds') - p_node_id::text
        );
    END IF;

    UPDATE public.trees SET structure = v_structure WHERE id = p_tree_id;

    RETURN v_structure;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Enable Realtime
-- =============================================

-- nodes: เพื่อให้เห็น node เพิ่ม/ย้าย/ลบ แบบ realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.nodes;

-- trees: เพื่อให้เห็น tree updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.trees;
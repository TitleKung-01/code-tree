-- =============================================
-- Add generation column to nodes
-- ให้ผู้ใช้กรอกรุ่น (generation) เอง ไม่ auto-calculate
-- =============================================

ALTER TABLE public.nodes
    ADD COLUMN generation INT NOT NULL DEFAULT 0;

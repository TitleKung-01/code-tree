drop extension if exists "pg_net";

drop index if exists "public"."unique_student_id_per_tree";

alter table "public"."nodes" alter column "student_id" set default ''::text;

CREATE UNIQUE INDEX unique_student_id_per_tree ON public.nodes USING btree (tree_id, student_id);

alter table "public"."nodes" add constraint "unique_student_id_per_tree" UNIQUE using index "unique_student_id_per_tree";



-- 1) Create the roles table
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);--> statement-breakpoint

-- 2) Create the role_permissions table
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"page" text NOT NULL,
	"can_view" boolean DEFAULT false NOT NULL,
	"can_write" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"data_filter" jsonb
);--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk"
  FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_page_idx" ON "role_permissions" USING btree ("role_id","page");--> statement-breakpoint

-- 3) Seed the three built-in roles
INSERT INTO "roles" ("name", "is_builtin") VALUES ('admin', true);--> statement-breakpoint
INSERT INTO "roles" ("name", "is_builtin") VALUES ('operator', true);--> statement-breakpoint
INSERT INTO "roles" ("name", "is_builtin") VALUES ('viewer', true);--> statement-breakpoint

-- 4) Seed default permissions for operator (all pages, view+write, no delete)
INSERT INTO "role_permissions" ("role_id", "page", "can_view", "can_write", "can_delete")
SELECT r.id, p.page, true, true, false
FROM "roles" r, (VALUES
  ('dashboard'),('parties'),('items'),('lots'),('invoices'),
  ('purchasing'),('boms'),('work-orders'),('shopfloor'),
  ('documents'),('eco'),('audit'),('account')
) AS p(page)
WHERE r.name = 'operator';--> statement-breakpoint

-- 5) Seed default permissions for viewer (all pages, view only — except account which gets write too)
INSERT INTO "role_permissions" ("role_id", "page", "can_view", "can_write", "can_delete")
SELECT r.id, p.page, true, false, false
FROM "roles" r, (VALUES
  ('dashboard'),('parties'),('items'),('lots'),('invoices'),
  ('purchasing'),('boms'),('work-orders'),('shopfloor'),
  ('documents'),('eco'),('audit')
) AS p(page)
WHERE r.name = 'viewer';--> statement-breakpoint

-- 5b) Account page: all roles can write (change own password)
INSERT INTO "role_permissions" ("role_id", "page", "can_view", "can_write", "can_delete")
SELECT r.id, 'account', true, true, false
FROM "roles" r
WHERE r.name IN ('viewer', 'operator');--> statement-breakpoint

-- 6) Add role_id column to users (nullable initially for migration)
ALTER TABLE "users" ADD COLUMN "role_id" uuid;--> statement-breakpoint

-- 7) Populate role_id from the existing role enum
UPDATE "users" SET "role_id" = (SELECT "id" FROM "roles" WHERE "roles"."name" = "users"."role"::text);--> statement-breakpoint

-- 8) Make role_id NOT NULL + add FK
ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk"
  FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- 9) Drop the old role column and enum type
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."user_role";

CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_email" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "boms" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "boms" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_time_idx" ON "audit_log" USING btree ("created_at");
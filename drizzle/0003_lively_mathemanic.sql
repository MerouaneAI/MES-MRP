DROP INDEX "audit_actor_idx";--> statement-breakpoint
DROP INDEX "audit_time_idx";--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "entity_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "user_email" text;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "audit_log" DROP COLUMN "actor_id";--> statement-breakpoint
ALTER TABLE "audit_log" DROP COLUMN "actor_email";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "active";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "lots" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "lots" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "parties" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "parties" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "boms" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "boms" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "work_orders" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "work_orders" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN "updated_by";
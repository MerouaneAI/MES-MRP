CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'delivered', 'returned');--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"lot_id" uuid,
	"description" text,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"line_total" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."item_kind";--> statement-breakpoint
CREATE TYPE "public"."item_kind" AS ENUM('raw_material', 'finished_good');--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "kind" SET DATA TYPE "public"."item_kind" USING "kind"::"public"."item_kind";--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "total_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "status" "invoice_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "returned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
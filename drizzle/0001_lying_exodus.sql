CREATE TYPE "public"."item_kind" AS ENUM('raw_material', 'finished_good', 'wip');--> statement-breakpoint
CREATE TYPE "public"."party_type" AS ENUM('customer', 'supplier', 'both');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('draft', 'ordered', 'received');--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"kind" "item_kind" NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL,
	"shelf_life_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lot_genealogy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"output_lot_id" uuid NOT NULL,
	"input_lot_id" uuid NOT NULL,
	"quantity_used" numeric(14, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"lot_number" text NOT NULL,
	"quantity_on_hand" numeric(14, 3) DEFAULT '0' NOT NULL,
	"produced_at" date,
	"expires_at" date,
	"source_po_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_counters" (
	"facility_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "invoice_counters_facility_id_fiscal_year_pk" PRIMARY KEY("facility_id","fiscal_year")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"party_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"sequence" integer NOT NULL,
	"invoice_no" text NOT NULL,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"type" "party_type" DEFAULT 'customer' NOT NULL,
	"name" text NOT NULL,
	"nif" text,
	"nis" text,
	"rc" text,
	"ai" text,
	"phone" text,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"description" text,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"line_total" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"status" "po_status" DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'DZD' NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"expected_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lot_genealogy" ADD CONSTRAINT "lot_genealogy_output_lot_id_lots_id_fk" FOREIGN KEY ("output_lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_genealogy" ADD CONSTRAINT "lot_genealogy_input_lot_id_lots_id_fk" FOREIGN KEY ("input_lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_parties_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "items_facility_sku_unique" ON "items" USING btree ("facility_id","sku");--> statement-breakpoint
CREATE INDEX "genealogy_output_idx" ON "lot_genealogy" USING btree ("output_lot_id");--> statement-breakpoint
CREATE INDEX "genealogy_input_idx" ON "lot_genealogy" USING btree ("input_lot_id");--> statement-breakpoint
CREATE INDEX "lots_expiry_idx" ON "lots" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "lots_item_lot_idx" ON "lots" USING btree ("item_id","lot_number");--> statement-breakpoint
CREATE INDEX "invoices_facility_year_idx" ON "invoices" USING btree ("facility_id","fiscal_year");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_no_unique" ON "invoices" USING btree ("facility_id","invoice_no");--> statement-breakpoint
CREATE INDEX "parties_facility_idx" ON "parties" USING btree ("facility_id");
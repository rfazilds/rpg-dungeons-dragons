CREATE TYPE "public"."campaign_message_type" AS ENUM('CHAT', 'DICE_ROLL', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."campaign_role" AS ENUM('DM', 'PLAYER');--> statement-breakpoint
CREATE TABLE "campaign_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"character_id" uuid,
	"role" "campaign_role" DEFAULT 'PLAYER' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"character_name" varchar(100),
	"content" text NOT NULL,
	"type" "campaign_message_type" DEFAULT 'CHAT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(6) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"dm_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_dm_id_users_id_fk" FOREIGN KEY ("dm_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_members_campaign_user_unique_idx" ON "campaign_members" USING btree ("campaign_id","user_id");--> statement-breakpoint
CREATE INDEX "campaign_members_campaign_id_idx" ON "campaign_members" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_members_user_id_idx" ON "campaign_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_messages_campaign_id_idx" ON "campaign_messages" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_messages_created_at_idx" ON "campaign_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_code_unique_idx" ON "campaigns" USING btree ("code");--> statement-breakpoint
CREATE INDEX "campaigns_dm_id_idx" ON "campaigns" USING btree ("dm_id");
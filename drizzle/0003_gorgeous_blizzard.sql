CREATE TYPE "public"."table_combatant_faction" AS ENUM('ALLY', 'ENEMY', 'NEUTRAL');--> statement-breakpoint
CREATE TYPE "public"."table_combatant_type" AS ENUM('PLAYER', 'MONSTER', 'NPC');--> statement-breakpoint
CREATE TABLE "table_combatants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"character_id" uuid,
	"type" "table_combatant_type" DEFAULT 'MONSTER' NOT NULL,
	"faction" "table_combatant_faction" DEFAULT 'ENEMY' NOT NULL,
	"name" varchar(120) NOT NULL,
	"avatar_url" text,
	"initiative" integer DEFAULT 0 NOT NULL,
	"initiative_modifier" integer DEFAULT 0 NOT NULL,
	"has_acted_this_round" boolean DEFAULT false NOT NULL,
	"current_hp" integer NOT NULL,
	"max_hp" integer NOT NULL,
	"temp_hp" integer DEFAULT 0 NOT NULL,
	"armor_class" integer NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stat_block" jsonb,
	"is_hidden_from_players" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "table_combatants" ADD CONSTRAINT "table_combatants_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_combatants" ADD CONSTRAINT "table_combatants_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "table_combatants_campaign_id_idx" ON "table_combatants" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "table_combatants_campaign_initiative_idx" ON "table_combatants" USING btree ("campaign_id","initiative");
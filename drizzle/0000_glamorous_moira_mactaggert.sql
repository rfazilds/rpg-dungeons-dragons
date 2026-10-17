CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"race" text NOT NULL,
	"class" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"alignment" text DEFAULT 'N' NOT NULL,
	"deity" text DEFAULT '',
	"background" text DEFAULT '',
	"size" text DEFAULT 'Médio' NOT NULL,
	"experience_points" integer DEFAULT 0 NOT NULL,
	"strength" integer DEFAULT 10 NOT NULL,
	"dexterity" integer DEFAULT 10 NOT NULL,
	"constitution" integer DEFAULT 10 NOT NULL,
	"intelligence" integer DEFAULT 10 NOT NULL,
	"wisdom" integer DEFAULT 10 NOT NULL,
	"charisma" integer DEFAULT 10 NOT NULL,
	"roll_method" text DEFAULT 'virtual' NOT NULL,
	"max_hp" integer DEFAULT 10 NOT NULL,
	"current_hp" integer DEFAULT 10 NOT NULL,
	"nonlethal_damage" integer DEFAULT 0 NOT NULL,
	"armor_class" integer DEFAULT 10 NOT NULL,
	"touch_armor_class" integer DEFAULT 10 NOT NULL,
	"flat_footed_armor_class" integer DEFAULT 10 NOT NULL,
	"speed" text DEFAULT '9m' NOT NULL,
	"base_attack_bonus" integer DEFAULT 0 NOT NULL,
	"spell_resistance" integer DEFAULT 0 NOT NULL,
	"damage_reduction" text DEFAULT '',
	"fortitude_misc" integer DEFAULT 0 NOT NULL,
	"reflex_misc" integer DEFAULT 0 NOT NULL,
	"will_misc" integer DEFAULT 0 NOT NULL,
	"skills" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"special_abilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"proficiencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '["Comum"]'::jsonb NOT NULL,
	"attacks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spell_slots" jsonb DEFAULT '{"0":{"max":0,"used":0,"bonusSpells":0,"saveDc":10,"preparedOrKnown":[]},"1":{"max":0,"used":0,"bonusSpells":0,"saveDc":11,"preparedOrKnown":[]},"2":{"max":0,"used":0,"bonusSpells":0,"saveDc":12,"preparedOrKnown":[]},"3":{"max":0,"used":0,"bonusSpells":0,"saveDc":13,"preparedOrKnown":[]},"4":{"max":0,"used":0,"bonusSpells":0,"saveDc":14,"preparedOrKnown":[]},"5":{"max":0,"used":0,"bonusSpells":0,"saveDc":15,"preparedOrKnown":[]},"6":{"max":0,"used":0,"bonusSpells":0,"saveDc":16,"preparedOrKnown":[]},"7":{"max":0,"used":0,"bonusSpells":0,"saveDc":17,"preparedOrKnown":[]},"8":{"max":0,"used":0,"bonusSpells":0,"saveDc":18,"preparedOrKnown":[]},"9":{"max":0,"used":0,"bonusSpells":0,"saveDc":19,"preparedOrKnown":[]}}'::jsonb NOT NULL,
	"equipment" jsonb DEFAULT '{"items":[],"currency":{"pc":0,"pp":0,"po":100,"pl":0}}'::jsonb NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combat_encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"adventure_slug" text,
	"round" integer DEFAULT 1 NOT NULL,
	"active_turn_index" integer DEFAULT 0 NOT NULL,
	"party_size" integer DEFAULT 4 NOT NULL,
	"party_level" integer DEFAULT 1 NOT NULL,
	"combatants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"password_hash" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combat_encounters" ADD CONSTRAINT "combat_encounters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "characters_user_id_idx" ON "characters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "combat_encounters_user_id_idx" ON "combat_encounters" USING btree ("user_id");
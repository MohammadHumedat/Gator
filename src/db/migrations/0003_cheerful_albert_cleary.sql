ALTER TABLE "feed_follows" RENAME COLUMN "feed_id" TO "feed_Id";--> statement-breakpoint
ALTER TABLE "feed_follows" DROP CONSTRAINT "feed_follows_user_id_feed_id_unique";--> statement-breakpoint
ALTER TABLE "feed_follows" DROP CONSTRAINT "feed_follows_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feed_follows" DROP CONSTRAINT "feed_follows_feed_id_feeds_id_fk";
--> statement-breakpoint
ALTER TABLE "feed_follows" ADD COLUMN "user_Id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "feed_follows" ADD CONSTRAINT "feed_follows_user_Id_users_id_fk" FOREIGN KEY ("user_Id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_follows" ADD CONSTRAINT "feed_follows_feed_Id_feeds_id_fk" FOREIGN KEY ("feed_Id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_follows" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "feed_follows" ADD CONSTRAINT "feed_follows_user_Id_feed_Id_unique" UNIQUE("user_Id","feed_Id");
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://user:password@ep-placeholder.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

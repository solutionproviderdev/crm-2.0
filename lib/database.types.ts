/**
 * @file database.types.ts
 * 
 * Auto-generated Supabase database types.
 * 
 * To regenerate, run:
 *   npx supabase gen types typescript --project-id <your-project-id> > lib/database.types.ts
 * 
 * The application uses hand-written types in lib/types.ts which reference these
 * generated types. Until this file is properly generated, lib/types.ts serves
 * as the source of truth for all database entities.
 * 
 * @see https://supabase.com/docs/guides/api/rest/generating-types
 */

export type Database = {
  public: {
    Tables: {
      // Types are defined in lib/types.ts
      // Run `npx supabase gen types` to populate this file with autoгенerated types
      [key: string]: unknown;
    };
  };
};
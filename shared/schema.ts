import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, decimal, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const snomedRef = pgTable("snomed_ref", {
  id: serial("id").primaryKey(),
  snomedCtCode: varchar("snomed_ct_code", { length: 50 }).notNull(),
  displayName: text("display_name").notNull(),
  commonName: text("common_name"),
  category: varchar("category", { length: 50 }).notNull(),
  subcategory: varchar("subcategory", { length: 50 }),
  anatomicalRegion: varchar("anatomical_region", { length: 100 }),
  specialty: varchar("specialty", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSnomedRefSchema = createInsertSchema(snomedRef).omit({
  id: true,
  createdAt: true,
});

export type SnomedRef = typeof snomedRef.$inferSelect;
export type InsertSnomedRef = z.infer<typeof insertSnomedRefSchema>;

export const procedures = pgTable("procedures", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  patientIdentifierHash: varchar("patient_identifier_hash", { length: 64 }),
  procedureDate: timestamp("procedure_date").notNull(),
  facility: text("facility"),
  specialty: varchar("specialty", { length: 50 }).notNull(),
  procedureSnomedCode: varchar("procedure_snomed_code", { length: 20 }),
  procedureDisplayName: text("procedure_display_name"),
  localCode: varchar("local_code", { length: 20 }),
  localCodeSystem: varchar("local_code_system", { length: 20 }),
  asaScore: varchar("asa_score", { length: 10 }),
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  smoker: varchar("smoker", { length: 20 }),
  diabetes: boolean("diabetes"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const proceduresRelations = relations(procedures, ({ one, many }) => ({
  user: one(users, {
    fields: [procedures.userId],
    references: [users.id],
  }),
  flaps: many(flaps),
}));

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;

export const flaps = pgTable("flaps", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  procedureId: varchar("procedure_id").notNull().references(() => procedures.id, { onDelete: "cascade" }),
  flapSnomedCode: varchar("flap_snomed_code", { length: 20 }),
  flapDisplayName: text("flap_display_name").notNull(),
  flapCommonName: text("flap_common_name"),
  side: varchar("side", { length: 10 }),
  composition: varchar("composition", { length: 50 }),
  harvestTechnique: varchar("harvest_technique", { length: 50 }),
  isFlowThrough: boolean("is_flow_through").default(false),
  recipientSite: varchar("recipient_site", { length: 100 }),
  recipientSiteRegion: varchar("recipient_site_region", { length: 50 }),
  indication: text("indication"),
  flapWidthCm: decimal("flap_width_cm", { precision: 5, scale: 2 }),
  flapLengthCm: decimal("flap_length_cm", { precision: 5, scale: 2 }),
  perforatorCount: integer("perforator_count"),
  elevationPlane: varchar("elevation_plane", { length: 50 }),
  ischemiaTimeMinutes: integer("ischemia_time_minutes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const flapsRelations = relations(flaps, ({ one, many }) => ({
  procedure: one(procedures, {
    fields: [flaps.procedureId],
    references: [procedures.id],
  }),
  anastomoses: many(anastomoses),
}));

export const insertFlapSchema = createInsertSchema(flaps).omit({
  id: true,
  createdAt: true,
});

export type Flap = typeof flaps.$inferSelect;
export type InsertFlap = z.infer<typeof insertFlapSchema>;

export const anastomoses = pgTable("anastomoses", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  flapId: varchar("flap_id").notNull().references(() => flaps.id, { onDelete: "cascade" }),
  vesselType: varchar("vessel_type", { length: 10 }).notNull(),
  recipientVesselSnomedCode: varchar("recipient_vessel_snomed_code", { length: 20 }),
  recipientVesselName: text("recipient_vessel_name").notNull(),
  donorVesselSnomedCode: varchar("donor_vessel_snomed_code", { length: 20 }),
  donorVesselName: text("donor_vessel_name"),
  couplingMethod: varchar("coupling_method", { length: 30 }),
  couplerSizeMm: decimal("coupler_size_mm", { precision: 4, scale: 2 }),
  configuration: varchar("configuration", { length: 30 }),
  sutureType: varchar("suture_type", { length: 50 }),
  sutureSize: varchar("suture_size", { length: 20 }),
  outcomeCheck: boolean("outcome_check"),
  patencyConfirmed: boolean("patency_confirmed"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const anastomosesRelations = relations(anastomoses, ({ one }) => ({
  flap: one(flaps, {
    fields: [anastomoses.flapId],
    references: [flaps.id],
  }),
}));

export const insertAnastomosisSchema = createInsertSchema(anastomoses).omit({
  id: true,
  createdAt: true,
});

export type Anastomosis = typeof anastomoses.$inferSelect;
export type InsertAnastomosis = z.infer<typeof insertAnastomosisSchema>;

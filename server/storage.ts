import { 
  users, type User, type InsertUser,
  profiles, type Profile, type InsertProfile,
  userFacilities, type UserFacility, type InsertUserFacility,
  snomedRef, type SnomedRef, type InsertSnomedRef,
  procedures, type Procedure, type InsertProcedure,
  flaps, type Flap, type InsertFlap,
  anastomoses, type Anastomosis, type InsertAnastomosis
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  getUserFacilities(userId: string): Promise<UserFacility[]>;
  createUserFacility(facility: InsertUserFacility): Promise<UserFacility>;
  updateUserFacility(id: string, facility: Partial<InsertUserFacility>): Promise<UserFacility | undefined>;
  deleteUserFacility(id: string): Promise<boolean>;
  
  getSnomedRefs(category?: string, anatomicalRegion?: string, specialty?: string): Promise<SnomedRef[]>;
  getSnomedRefByCode(snomedCtCode: string): Promise<SnomedRef | undefined>;
  createSnomedRef(ref: InsertSnomedRef): Promise<SnomedRef>;
  bulkCreateSnomedRefs(refs: InsertSnomedRef[]): Promise<SnomedRef[]>;
  
  getProcedure(id: string): Promise<Procedure | undefined>;
  getProceduresByUser(userId: string): Promise<Procedure[]>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: string, procedure: Partial<InsertProcedure>): Promise<Procedure | undefined>;
  
  getFlap(id: string): Promise<Flap | undefined>;
  getFlapsByProcedure(procedureId: string): Promise<Flap[]>;
  createFlap(flap: InsertFlap): Promise<Flap>;
  updateFlap(id: string, flap: Partial<InsertFlap>): Promise<Flap | undefined>;
  deleteFlap(id: string): Promise<boolean>;
  
  getAnastomosis(id: string): Promise<Anastomosis | undefined>;
  getAnastomosesByFlap(flapId: string): Promise<Anastomosis[]>;
  createAnastomosis(anastomosis: InsertAnastomosis): Promise<Anastomosis>;
  updateAnastomosis(id: string, anastomosis: Partial<InsertAnastomosis>): Promise<Anastomosis | undefined>;
  deleteAnastomosis(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [created] = await db.insert(profiles).values(profile).returning();
    return created;
  }

  async updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [updated] = await db
      .update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated || undefined;
  }

  async getUserFacilities(userId: string): Promise<UserFacility[]> {
    return db.select().from(userFacilities).where(eq(userFacilities.userId, userId));
  }

  async createUserFacility(facility: InsertUserFacility): Promise<UserFacility> {
    const [created] = await db.insert(userFacilities).values(facility).returning();
    return created;
  }

  async updateUserFacility(id: string, facility: Partial<InsertUserFacility>): Promise<UserFacility | undefined> {
    const [updated] = await db
      .update(userFacilities)
      .set(facility)
      .where(eq(userFacilities.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUserFacility(id: string): Promise<boolean> {
    const result = await db.delete(userFacilities).where(eq(userFacilities.id, id));
    return true;
  }

  async getSnomedRefs(category?: string, anatomicalRegion?: string, specialty?: string): Promise<SnomedRef[]> {
    let query = db.select().from(snomedRef).where(eq(snomedRef.isActive, true));
    
    const conditions = [eq(snomedRef.isActive, true)];
    
    if (category) {
      conditions.push(eq(snomedRef.category, category));
    }
    if (anatomicalRegion) {
      conditions.push(eq(snomedRef.anatomicalRegion, anatomicalRegion));
    }
    if (specialty) {
      conditions.push(eq(snomedRef.specialty, specialty));
    }
    
    const result = await db
      .select()
      .from(snomedRef)
      .where(and(...conditions))
      .orderBy(snomedRef.sortOrder, snomedRef.displayName);
    
    return result;
  }

  async getSnomedRefByCode(snomedCtCode: string): Promise<SnomedRef | undefined> {
    const [ref] = await db.select().from(snomedRef).where(eq(snomedRef.snomedCtCode, snomedCtCode));
    return ref || undefined;
  }

  async createSnomedRef(ref: InsertSnomedRef): Promise<SnomedRef> {
    const [created] = await db.insert(snomedRef).values(ref).returning();
    return created;
  }

  async bulkCreateSnomedRefs(refs: InsertSnomedRef[]): Promise<SnomedRef[]> {
    if (refs.length === 0) return [];
    const created = await db.insert(snomedRef).values(refs).returning();
    return created;
  }

  async getProcedure(id: string): Promise<Procedure | undefined> {
    const [procedure] = await db.select().from(procedures).where(eq(procedures.id, id));
    return procedure || undefined;
  }

  async getProceduresByUser(userId: string): Promise<Procedure[]> {
    return db.select().from(procedures).where(eq(procedures.userId, userId));
  }

  async createProcedure(procedure: InsertProcedure): Promise<Procedure> {
    const [created] = await db.insert(procedures).values(procedure).returning();
    return created;
  }

  async updateProcedure(id: string, procedure: Partial<InsertProcedure>): Promise<Procedure | undefined> {
    const [updated] = await db
      .update(procedures)
      .set({ ...procedure, updatedAt: new Date() })
      .where(eq(procedures.id, id))
      .returning();
    return updated || undefined;
  }

  async getFlap(id: string): Promise<Flap | undefined> {
    const [flap] = await db.select().from(flaps).where(eq(flaps.id, id));
    return flap || undefined;
  }

  async getFlapsByProcedure(procedureId: string): Promise<Flap[]> {
    return db.select().from(flaps).where(eq(flaps.procedureId, procedureId));
  }

  async createFlap(flap: InsertFlap): Promise<Flap> {
    const [created] = await db.insert(flaps).values(flap).returning();
    return created;
  }

  async updateFlap(id: string, flap: Partial<InsertFlap>): Promise<Flap | undefined> {
    const [updated] = await db.update(flaps).set(flap).where(eq(flaps.id, id)).returning();
    return updated || undefined;
  }

  async deleteFlap(id: string): Promise<boolean> {
    const result = await db.delete(flaps).where(eq(flaps.id, id));
    return true;
  }

  async getAnastomosis(id: string): Promise<Anastomosis | undefined> {
    const [anastomosis] = await db.select().from(anastomoses).where(eq(anastomoses.id, id));
    return anastomosis || undefined;
  }

  async getAnastomosesByFlap(flapId: string): Promise<Anastomosis[]> {
    return db.select().from(anastomoses).where(eq(anastomoses.flapId, flapId));
  }

  async createAnastomosis(anastomosis: InsertAnastomosis): Promise<Anastomosis> {
    const [created] = await db.insert(anastomoses).values(anastomosis).returning();
    return created;
  }

  async updateAnastomosis(id: string, anastomosis: Partial<InsertAnastomosis>): Promise<Anastomosis | undefined> {
    const [updated] = await db.update(anastomoses).set(anastomosis).where(eq(anastomoses.id, id)).returning();
    return updated || undefined;
  }

  async deleteAnastomosis(id: string): Promise<boolean> {
    await db.delete(anastomoses).where(eq(anastomoses.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();

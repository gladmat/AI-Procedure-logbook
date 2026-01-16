import { 
  users, type User, type InsertUser,
  snomedRef, type SnomedRef, type InsertSnomedRef,
  procedures, type Procedure, type InsertProcedure,
  flaps, type Flap, type InsertFlap,
  anastomoses, type Anastomosis, type InsertAnastomosis
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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

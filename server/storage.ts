import {
  users,
  type User,
  type InsertUser,
  profiles,
  type Profile,
  type InsertProfile,
  userFacilities,
  type UserFacility,
  type InsertUserFacility,
  snomedRef,
  type SnomedRef,
  type InsertSnomedRef,
  passwordResetTokens,
  type PasswordResetToken,
  userDeviceKeys,
  type UserDeviceKey,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, sql, lt, isNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<boolean>;
  deleteUserAccount(userId: string): Promise<void>;

  createPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: string): Promise<boolean>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(
    userId: string,
    profile: Partial<InsertProfile>,
  ): Promise<Profile | undefined>;

  getUserFacilities(userId: string): Promise<UserFacility[]>;
  createUserFacility(facility: InsertUserFacility): Promise<UserFacility>;
  updateUserFacility(
    id: string,
    userId: string,
    facility: Partial<InsertUserFacility>,
  ): Promise<UserFacility | undefined>;
  clearPrimaryFacilities(userId: string, excludeId: string): Promise<void>;
  // IMPROVEMENT: IDOR fix — requires userId to enforce ownership at query level
  deleteUserFacility(id: string, userId: string): Promise<boolean>;

  getSnomedRefs(
    category?: string,
    anatomicalRegion?: string,
    specialty?: string,
  ): Promise<SnomedRef[]>;
  getSnomedRefByCode(snomedCtCode: string): Promise<SnomedRef | undefined>;
  createSnomedRef(ref: InsertSnomedRef): Promise<SnomedRef>;
  bulkCreateSnomedRefs(refs: InsertSnomedRef[]): Promise<SnomedRef[]>;

  getUserDeviceKeys(userId: string): Promise<UserDeviceKey[]>;
  upsertUserDeviceKey(
    userId: string,
    deviceId: string,
    publicKey: string,
    label?: string | null,
  ): Promise<UserDeviceKey>;
  revokeUserDeviceKey(userId: string, deviceId: string): Promise<boolean>;
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
    return user!;
  }

  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<boolean> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, userId));
    return true;
  }

  async deleteUserAccount(userId: string): Promise<void> {
    // With cascades configured, deleting the user row removes all related data:
    // profiles, user_facilities, user_device_keys, password_reset_tokens,
    // team_members, and owned teams.
    await db.delete(users).where(eq(users.id, userId));
  }

  async createPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const [created] = await db
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();
    return created!;
  }

  async getPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markPasswordResetTokenUsed(id: string): Promise<boolean> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, id));
    return true;
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile || undefined;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [created] = await db.insert(profiles).values(profile).returning();
    return created!;
  }

  async updateProfile(
    userId: string,
    profile: Partial<InsertProfile>,
  ): Promise<Profile | undefined> {
    const [updated] = await db
      .update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated || undefined;
  }

  async getUserFacilities(userId: string): Promise<UserFacility[]> {
    return db
      .select()
      .from(userFacilities)
      .where(eq(userFacilities.userId, userId));
  }

  async createUserFacility(
    facility: InsertUserFacility,
  ): Promise<UserFacility> {
    const [created] = await db
      .insert(userFacilities)
      .values(facility)
      .returning();
    return created!;
  }

  async updateUserFacility(
    id: string,
    userId: string,
    facility: Partial<InsertUserFacility>,
  ): Promise<UserFacility | undefined> {
    const [updated] = await db
      .update(userFacilities)
      .set(facility)
      .where(and(eq(userFacilities.id, id), eq(userFacilities.userId, userId)))
      .returning();
    return updated || undefined;
  }

  // Batch unset isPrimary for all user facilities except the one being set as primary
  async clearPrimaryFacilities(
    userId: string,
    excludeId: string,
  ): Promise<void> {
    await db
      .update(userFacilities)
      .set({ isPrimary: false })
      .where(
        and(
          eq(userFacilities.userId, userId),
          eq(userFacilities.isPrimary, true),
          ne(userFacilities.id, excludeId),
        ),
      );
  }

  // IMPROVEMENT: IDOR fix — deletes only if BOTH id and userId match,
  // preventing any user from deleting another user's facility by guessing the id.
  async deleteUserFacility(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(userFacilities)
      .where(and(eq(userFacilities.id, id), eq(userFacilities.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getSnomedRefs(
    category?: string,
    anatomicalRegion?: string,
    specialty?: string,
  ): Promise<SnomedRef[]> {
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

  async getSnomedRefByCode(
    snomedCtCode: string,
  ): Promise<SnomedRef | undefined> {
    const [ref] = await db
      .select()
      .from(snomedRef)
      .where(eq(snomedRef.snomedCtCode, snomedCtCode));
    return ref || undefined;
  }

  async createSnomedRef(ref: InsertSnomedRef): Promise<SnomedRef> {
    const [created] = await db.insert(snomedRef).values(ref).returning();
    return created!;
  }

  async bulkCreateSnomedRefs(refs: InsertSnomedRef[]): Promise<SnomedRef[]> {
    if (refs.length === 0) return [];
    const created = await db.insert(snomedRef).values(refs).returning();
    return created;
  }

  async getUserDeviceKeys(userId: string): Promise<UserDeviceKey[]> {
    return db
      .select()
      .from(userDeviceKeys)
      .where(
        and(
          eq(userDeviceKeys.userId, userId),
          isNull(userDeviceKeys.revokedAt),
        ),
      );
  }

  async upsertUserDeviceKey(
    userId: string,
    deviceId: string,
    publicKey: string,
    label?: string | null,
  ): Promise<UserDeviceKey> {
    const [existing] = await db
      .select()
      .from(userDeviceKeys)
      .where(
        and(
          eq(userDeviceKeys.userId, userId),
          eq(userDeviceKeys.deviceId, deviceId),
        ),
      );

    if (existing) {
      const [updated] = await db
        .update(userDeviceKeys)
        .set({
          publicKey,
          label: label ?? existing.label ?? null,
          lastSeenAt: new Date(),
          revokedAt: null,
        })
        .where(eq(userDeviceKeys.id, existing.id))
        .returning();
      return updated!;
    }

    const [created] = await db
      .insert(userDeviceKeys)
      .values({ userId, deviceId, publicKey, label: label ?? null })
      .returning();
    return created!;
  }

  async revokeUserDeviceKey(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    await db
      .update(userDeviceKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(userDeviceKeys.userId, userId),
          eq(userDeviceKeys.deviceId, deviceId),
        ),
      );
    return true;
  }
}

export const storage = new DatabaseStorage();

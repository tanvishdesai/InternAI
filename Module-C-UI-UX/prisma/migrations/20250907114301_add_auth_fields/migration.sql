-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "password" TEXT,
    "isAuthenticated" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "educationLevel" TEXT,
    "majorField" TEXT,
    "skills" TEXT NOT NULL,
    "preferredSectors" TEXT NOT NULL,
    "careerGoal" TEXT,
    "preferredLocations" TEXT NOT NULL,
    "remoteOk" BOOLEAN NOT NULL DEFAULT false,
    "availabilityStart" DATETIME,
    "durationWeeksPref" INTEGER,
    "stipendPref" TEXT,
    "yearsOfExperience" INTEGER DEFAULT 0
);
INSERT INTO "new_user_profiles" ("availabilityStart", "careerGoal", "createdAt", "durationWeeksPref", "educationLevel", "email", "id", "majorField", "name", "preferredLocations", "preferredSectors", "remoteOk", "skills", "stipendPref", "updatedAt") SELECT "availabilityStart", "careerGoal", "createdAt", "durationWeeksPref", "educationLevel", "email", "id", "majorField", "name", "preferredLocations", "preferredSectors", "remoteOk", "skills", "stipendPref", "updatedAt" FROM "user_profiles";
DROP TABLE "user_profiles";
ALTER TABLE "new_user_profiles" RENAME TO "user_profiles";
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

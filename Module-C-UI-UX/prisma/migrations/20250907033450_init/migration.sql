-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "educationLevel" TEXT NOT NULL,
    "majorField" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "preferredSectors" TEXT NOT NULL,
    "careerGoal" TEXT,
    "preferredLocations" TEXT NOT NULL,
    "remoteOk" BOOLEAN NOT NULL DEFAULT false,
    "availabilityStart" DATETIME,
    "durationWeeksPref" INTEGER,
    "stipendPref" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

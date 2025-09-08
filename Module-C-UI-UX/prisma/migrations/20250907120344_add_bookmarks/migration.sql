-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "internshipId" TEXT NOT NULL,
    "internshipData" TEXT NOT NULL,
    CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_internshipId_key" ON "bookmarks"("userId", "internshipId");

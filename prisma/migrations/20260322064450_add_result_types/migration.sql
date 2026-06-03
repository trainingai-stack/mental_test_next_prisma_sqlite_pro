-- CreateTable
CREATE TABLE "ResultType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "explanation" TEXT,
    "suggestion" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT,
    "testId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResultType_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResultCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resultTypeId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResultCondition_resultTypeId_fkey" FOREIGN KEY ("resultTypeId") REFERENCES "ResultType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "resultTypeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Response_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Response_resultTypeId_fkey" FOREIGN KEY ("resultTypeId") REFERENCES "ResultType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Response" ("createdAt", "id", "testId") SELECT "createdAt", "id", "testId" FROM "Response";
DROP TABLE "Response";
ALTER TABLE "new_Response" RENAME TO "Response";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

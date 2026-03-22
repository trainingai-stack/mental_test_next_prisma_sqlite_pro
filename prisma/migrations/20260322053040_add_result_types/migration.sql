-- CreateTable
CREATE TABLE "ResultType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "advice" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResultType_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResultRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resultTypeId" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "matchType" TEXT NOT NULL DEFAULT 'all',
    "scoreThreshold" INTEGER,
    CONSTRAINT "ResultRule_resultTypeId_fkey" FOREIGN KEY ("resultTypeId") REFERENCES "ResultType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "resultTypeId" TEXT NOT NULL,
    "shareToken" TEXT,
    "totalScore" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestResult_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestResult_resultTypeId_fkey" FOREIGN KEY ("resultTypeId") REFERENCES "ResultType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TestResult_responseId_key" ON "TestResult"("responseId");

-- CreateIndex
CREATE UNIQUE INDEX "TestResult_shareToken_key" ON "TestResult"("shareToken");

CREATE TABLE "PendingPhotoDeletion" (
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PendingPhotoDeletion_pkey" PRIMARY KEY ("filePath")
);

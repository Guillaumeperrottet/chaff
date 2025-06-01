-- CreateTable
CREATE TABLE "object_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "object_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "object_access_userId_objectId_key" ON "object_access"("userId", "objectId");

-- AddForeignKey
ALTER TABLE "object_access" ADD CONSTRAINT "object_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_access" ADD CONSTRAINT "object_access_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "objet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ServerNode" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameServer" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "nodeId" TEXT,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "ports" JSONB,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GameServer" ADD CONSTRAINT "GameServer_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "ServerNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

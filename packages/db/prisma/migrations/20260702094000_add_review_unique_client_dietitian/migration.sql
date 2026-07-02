-- CreateIndex
CREATE UNIQUE INDEX "Review_clientId_dietitianId_key" ON "Review"("clientId", "dietitianId");

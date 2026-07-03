-- CreateEnum
CREATE TYPE "ReferenceSex" AS ENUM ('MALE', 'FEMALE', 'ALL');

-- CreateEnum
CREATE TYPE "ReferenceLifeStage" AS ENUM ('NONE', 'PREGNANCY', 'LACTATION');

-- CreateTable
CREATE TABLE "ReferenceIntake" (
    "id" TEXT NOT NULL,
    "nutrient" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "ageMinYears" INTEGER NOT NULL,
    "ageMaxYears" INTEGER,
    "sex" "ReferenceSex" NOT NULL,
    "lifeStage" "ReferenceLifeStage" NOT NULL DEFAULT 'NONE',
    "value" DECIMAL(65,30) NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "isVerifiedSource" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceIntake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferenceIntake_nutrient_idx" ON "ReferenceIntake"("nutrient");

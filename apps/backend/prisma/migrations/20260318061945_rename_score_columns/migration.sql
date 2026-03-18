/*
  Warnings:

  - You are about to drop the column `commScore` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `projectScore` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `techScore` on the `Analysis` table. All the data in the column will be lost.
  - Added the required column `communicationScore` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experienceScore` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expertiseScore` to the `Analysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "commScore",
DROP COLUMN "projectScore",
DROP COLUMN "techScore",
ADD COLUMN     "communicationScore" INTEGER NOT NULL,
ADD COLUMN     "experienceScore" INTEGER NOT NULL,
ADD COLUMN     "expertiseScore" INTEGER NOT NULL;

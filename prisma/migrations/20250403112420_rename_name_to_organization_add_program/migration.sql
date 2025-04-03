/*
  Warnings:

  - You are about to drop the column `name` on the `Resource` table. All the data in the column will be lost.
  - Added the required column `organization` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SavedResource" DROP CONSTRAINT "SavedResource_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "SavedResource" DROP CONSTRAINT "SavedResource_userId_fkey";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "name",
ADD COLUMN     "organization" TEXT NOT NULL,
ADD COLUMN     "program" TEXT;

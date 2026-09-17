-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "passwordProvisoria" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex
DROP INDEX "User_telefono_key";
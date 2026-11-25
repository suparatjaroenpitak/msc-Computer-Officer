-- Allow user progress to be attached to AI-generated recall cards as well as seeded cards.
ALTER TABLE "StudyCardProgress" ALTER COLUMN "cardId" DROP NOT NULL;
ALTER TABLE "StudyCardProgress" ADD COLUMN IF NOT EXISTS "generatedItemId" TEXT;

DO $$
BEGIN
  ALTER TABLE "StudyCardProgress"
    ADD CONSTRAINT "StudyCardProgress_generatedItemId_fkey"
    FOREIGN KEY ("generatedItemId") REFERENCES "StudyGeneratedItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "StudyCardProgress_userId_generatedItemId_key"
  ON "StudyCardProgress"("userId", "generatedItemId");

/**
 * One-time DB cleanup script to delete orphaned Movie records.
 *
 * The Movie table caches TMDB data. 262K+ rows exist but only ~194 are
 * referenced by any user data. The orphans consume ~478 MB of the 500 MB
 * Neon free tier.
 *
 * Run: npx tsx scripts/db-cleanup.ts
 * Safe to delete this file after running.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Count before
  const totalBefore = await prisma.movie.count()
  console.log(`Total movies before cleanup: ${totalBefore}`)

  // Delete orphaned movies in batches (movies not referenced by any table)
  // Using raw SQL for efficiency — a single DELETE with NOT EXISTS subqueries
  const result = await prisma.$executeRawUnsafe(`
    DELETE FROM public."Movie" m
    WHERE NOT EXISTS (SELECT 1 FROM public."Review" r WHERE r."movieId" = m.id)
      AND NOT EXISTS (SELECT 1 FROM public."DiaryEntry" d WHERE d."movieId" = m.id)
      AND NOT EXISTS (SELECT 1 FROM public."WatchlistItem" w WHERE w."movieId" = m.id)
      AND NOT EXISTS (SELECT 1 FROM public."FavoriteMovie" f WHERE f."movieId" = m.id)
      AND NOT EXISTS (SELECT 1 FROM public."ListItem" li WHERE li."movieId" = m.id)
      AND NOT EXISTS (SELECT 1 FROM public."Recommendation" rec WHERE rec."movieId" = m.id)
      AND NOT EXISTS (SELECT 1 FROM public."Activity" a WHERE a."movieId" = m.id)
      AND NOT EXISTS (SELECT 1 FROM public."Notification" n WHERE n."movieId" = m.id)
  `)

  console.log(`Deleted ${result} orphaned movies`)

  // Count after
  const totalAfter = await prisma.movie.count()
  console.log(`Total movies after cleanup: ${totalAfter}`)

  // Also clean up expired sessions/tokens while we're here
  const expiredSessions = await prisma.session.deleteMany({
    where: { expires: { lt: new Date() } }
  })
  console.log(`Deleted ${expiredSessions.count} expired sessions`)

  const expiredVerificationTokens = await prisma.$executeRawUnsafe(`
    DELETE FROM public."VerificationToken" WHERE expires < NOW()
  `)
  console.log(`Deleted ${expiredVerificationTokens} expired verification tokens`)

  const expiredPasswordTokens = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  })
  console.log(`Deleted ${expiredPasswordTokens.count} expired password reset tokens`)

  // Show final table size
  const sizes = await prisma.$queryRawUnsafe(`
    SELECT
      tablename,
      pg_size_pretty(pg_total_relation_size('public.' || '"' || tablename || '"')) AS total_size,
      pg_total_relation_size('public.' || '"' || tablename || '"') AS size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC
    LIMIT 5
  `)
  console.log('\nTop 5 tables by size after cleanup:')
  for (const row of sizes as any[]) {
    console.log(`  ${row.tablename.padEnd(25)} ${row.total_size}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

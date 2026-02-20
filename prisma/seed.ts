import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('password123', 12)

  // Create demo users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice',
      password,
      bio: 'Film noir obsessive. Tarkovsky disciple. 🎬',
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob',
      password,
      bio: 'Horror aficionado. Kubrick or nothing.',
    },
  })

  // Alice follows Bob
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    update: {},
    create: { followerId: alice.id, followingId: bob.id },
  })

  console.log('Seed complete.')
  console.log('Demo accounts: alice@example.com / bob@example.com (password: password123)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

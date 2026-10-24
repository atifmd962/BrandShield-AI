import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo1234', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@novatech.com' },
    update: {},
    create: {
      name: 'Alex Admin',
      email: 'admin@novatech.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: 'creator@novatech.com' },
    update: {},
    create: {
      name: 'Casey Creator',
      email: 'creator@novatech.com',
      password: hashedPassword,
      role: Role.CREATOR,
    },
  })

  await prisma.user.upsert({
    where: { email: 'reviewer@novatech.com' },
    update: {},
    create: {
      name: 'Riley Reviewer',
      email: 'reviewer@novatech.com',
      password: hashedPassword,
      role: Role.REVIEWER,
    },
  })

  await prisma.user.upsert({
    where: { email: 'manager@novatech.com' },
    update: {},
    create: {
      name: 'Morgan Manager',
      email: 'manager@novatech.com',
      password: hashedPassword,
      role: Role.MANAGER,
    },
  })

  // Create demo brand document (NovaTech Flow Product Facts)
  const existingDoc = await prisma.brandDocument.findFirst({
    where: { name: 'NovaTech Flow — Product Facts v1.0' },
  })

  if (!existingDoc) {
    const doc = await prisma.brandDocument.create({
      data: {
        name: 'NovaTech Flow — Product Facts v1.0',
        fileType: 'txt',
        version: '1.0',
        status: 'READY',
        uploadedById: admin.id,
      },
    })

    // Seed passages
    const passages = [
      {
        content: 'NovaTech Flow reduces processing time by up to 30%. This performance improvement has been validated through internal benchmarking under standard operating conditions.',
        pageNumber: 1,
        chunkIndex: 0,
      },
      {
        content: 'NovaTech Flow includes a 1-year standard warranty covering manufacturing defects. Extended warranty options are available separately.',
        pageNumber: 1,
        chunkIndex: 1,
      },
      {
        content: 'NovaTech Flow is available in three configurations: Starter, Professional, and Enterprise. Each configuration is designed for different organisational scales.',
        pageNumber: 2,
        chunkIndex: 2,
      },
      {
        content: 'NovaTech Flow integrates with existing enterprise systems via RESTful API. Dedicated integration support is provided for Professional and Enterprise tiers.',
        pageNumber: 2,
        chunkIndex: 3,
      },
      {
        content: 'NovaTech Flow pricing is available on request. Volume discounts apply for orders of 10 or more licences.',
        pageNumber: 3,
        chunkIndex: 4,
      },
      {
        content: 'NovaTech Flow has been adopted by over 200 organisations across the manufacturing and logistics sectors as of Q4 2024.',
        pageNumber: 3,
        chunkIndex: 5,
      },
    ]

    for (const passage of passages) {
      await prisma.passage.create({
        data: {
          documentId: doc.id,
          ...passage,
        },
      })
    }

    console.log('Created demo document with passages')
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

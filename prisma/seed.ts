import { PrismaClient, Role, Status, RecordType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('admin123', 12);
  const analystHash = await bcrypt.hash('analyst123', 12);
  const viewerHash = await bcrypt.hash('viewer123', 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@financer.com' },
    update: {},
    create: {
      email: 'admin@financer.com',
      passwordHash,
      name: 'Admin User',
      role: Role.ADMIN,
      status: Status.ACTIVE,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@financer.com' },
    update: {},
    create: {
      email: 'analyst@financer.com',
      passwordHash: analystHash,
      name: 'Analyst User',
      role: Role.ANALYST,
      status: Status.ACTIVE,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@financer.com' },
    update: {},
    create: {
      email: 'viewer@financer.com',
      passwordHash: viewerHash,
      name: 'Viewer User',
      role: Role.VIEWER,
      status: Status.ACTIVE,
    },
  });

  console.log('✅ Users seeded');

  // Seed Records
  const count = await prisma.financialRecord.count();
  if (count === 0) {
    const categories = ['Salary', 'Freelance', 'Groceries', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Healthcare'];
    const now = new Date();
    const recordsToInsert = [];

    for (let i = 0; i < 30; i++) {
      const type = i % 3 === 0 ? RecordType.INCOME : RecordType.EXPENSE;
      
      let category = '';
      if (type === RecordType.INCOME) {
        category = i % 2 === 0 ? 'Salary' : 'Freelance';
      } else {
        category = categories[2 + (i % 6)] as string; // index is always 2–7, array has 8 elements
      }
      
      const recordDate = new Date(now);
      recordDate.setDate(now.getDate() - (i * 5)); // spread over the last 150 days

      recordsToInsert.push({
        userId: admin.id,
        amount: parseFloat((Math.random() * 500 + 50).toFixed(2)),
        type,
        category,
        date: recordDate,
        description: `Sample ${type.toLowerCase()} for ${category}`,
      });
    }

    await prisma.financialRecord.createMany({
      data: recordsToInsert,
    });
    console.log(`✅ Seeded ${recordsToInsert.length} financial records`);
  } else {
    console.log('⚠️ Records already exist, skipping record seeding');
  }

  console.log('🎉 Seeding finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

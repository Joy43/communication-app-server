// Quick script to check users in the database
import { PrismaClient } from '@prisma';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n===== Users in Database =====');
    console.log(`Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found in the database!');
      console.log('You may need to seed the database or create users first.\n');
    } else {
      users.forEach((user: any, index: number) => {
        console.log(`${index + 1}. ${user.name || 'No name'}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email || 'No email'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // Check for the specific user ID from the error
    const missingUserId = '67ae2477-73bd-4349-8178-2215539e51f0';
    const missingUser = await prisma.user.findUnique({
      where: { id: missingUserId },
    });

    console.log(`\n===== Checking Specific User =====`);
    console.log(`User ID: ${missingUserId}`);
    console.log(`Exists: ${missingUser ? '✅ Yes' : '❌ No'}`);

    if (!missingUser) {
      console.log('\n⚠️  This user ID does not exist in the database!');
      console.log(
        'Make sure you are using valid user IDs when starting a call.',
      );
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

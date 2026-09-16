const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', password },
    create: {
      email,
      name: 'Admin User',
      password,
      role: 'admin'
    }
  });
  console.log('Admin user created:', user);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

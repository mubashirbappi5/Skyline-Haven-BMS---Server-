const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'bappi561@gmail.com';
  const password = await bcrypt.hash('Bappi56', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', password }, // Ensure admin role and update password
    create: {
      email,
      name: 'Bappi',
      password,
      role: 'admin'
    }
  });
  console.log('User synced:', user.email, 'Role:', user.role);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

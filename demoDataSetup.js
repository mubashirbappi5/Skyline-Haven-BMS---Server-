const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  // Optional: await prisma.payment.deleteMany();
  // Optional: await prisma.agreementRequest.deleteMany();
  // Optional: await prisma.apartment.deleteMany();
  // Optional: await prisma.user.deleteMany();

  console.log('Inserting demo users...');
  const password = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { role: 'admin', password },
    create: { email: 'admin@demo.com', name: 'Demo Admin', password, role: 'admin' }
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@demo.com' },
    update: { role: 'member', password },
    create: { email: 'member@demo.com', name: 'Demo Member', password, role: 'member' }
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: { role: 'user', password },
    create: { email: 'user@demo.com', name: 'Demo User', password, role: 'user' }
  });

  console.log('Inserting demo apartments...');
  const apartments = [
    { apartmentNo: 'A1', blockName: 'Block A', floorNo: 1, rent: 1200, status: 'available' },
    { apartmentNo: 'B2', blockName: 'Block B', floorNo: 2, rent: 1500, status: 'available' },
    { apartmentNo: 'C3', blockName: 'Block C', floorNo: 3, rent: 1800, status: 'available' },
    { apartmentNo: 'D4', blockName: 'Block D', floorNo: 4, rent: 2000, status: 'available' },
    { apartmentNo: 'E5', blockName: 'Block E', floorNo: 5, rent: 2500, status: 'available' },
    { apartmentNo: 'F6', blockName: 'Block F', floorNo: 6, rent: 3000, status: 'available' },
  ];

  for (const apt of apartments) {
    // Upsert by a unique constraint if possible, but we don't have one in prisma except id.
    // We'll just create if not exists by looking up apartmentNo.
    const exists = await prisma.apartment.findFirst({ where: { apartmentNo: apt.apartmentNo } });
    if (!exists) {
      await prisma.apartment.create({ data: apt });
    }
  }

  console.log('Demo data setup complete!');
  console.log(`Test Credentials (Password: password123):`);
  console.log(`Admin: admin@demo.com`);
  console.log(`Member: member@demo.com`);
  console.log(`User: user@demo.com`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

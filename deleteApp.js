const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.apartment.deleteMany()
  .then(r => console.log('Deleted apartments:', r.count))
  .catch(console.error)
  .finally(() => prisma.$disconnect());

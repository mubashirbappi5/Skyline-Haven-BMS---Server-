const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reqCount = await prisma.agreementRequest.deleteMany();
  console.log('Deleted AgreementRequests:', reqCount.count);
  
  const accCount = await prisma.acceptedRequest.deleteMany();
  console.log('Deleted AcceptedRequests:', accCount.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

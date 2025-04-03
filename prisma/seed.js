import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'Administrator',
      role: 'ADMIN'
    }
  });
  
  console.log('Created admin user:', adminUser);
  
  // Create default case manager
  const caseManagerPassword = await bcrypt.hash('casemanager123', 10);
  
  const caseManager = await prisma.user.upsert({
    where: { username: 'casemanager' },
    update: {},
    create: {
      username: 'casemanager',
      password: caseManagerPassword,
      fullName: 'Case Manager',
      role: 'CASE_MANAGER'
    }
  });
  
  console.log('Created case manager:', caseManager);
  
  // Create some initial resources
  const initialResources = [
    {
      organization: 'Local Food Bank',
      program: 'Emergency Food Assistance',
      category: 'Food',
      status: 'AVAILABLE',
      contactDetails: {
        address: '123 Main St, Anytown, CA 92618',
        phone: '949-555-1234',
        email: 'info@localfoodbank.org',
        website: 'www.localfoodbank.org',
        description: 'Provides emergency food assistance to individuals and families in need.'
      },
      zipcode: '92618'
    },
    {
      organization: 'Community Housing Services',
      category: 'Housing',
      status: 'AVAILABLE',
      contactDetails: {
        address: '456 Oak Rd, Anytown, CA 92618',
        phone: '949-555-5678',
        email: 'help@housingservices.org',
        website: 'www.housingservices.org',
        description: 'Offers transitional housing and rental assistance for low-income individuals.'
      },
      zipcode: '92618'
    },
    {
      organization: 'Health Alliance',
      program: 'Mental Health Support',
      category: 'Healthcare',
      status: 'LIMITED',
      contactDetails: {
        address: '789 Elm St, Anytown, CA 92620',
        phone: '949-555-9012',
        email: 'contact@healthalliance.org',
        website: 'www.healthalliance.org',
        description: 'Provides mental health services including counseling and support groups.',
        services: ['Counseling', 'Support Groups', 'Medication Management'],
        eligibility: ['Open to all residents', 'No insurance required for initial consultation'],
        hours: [
          { day: 'Monday', hours: '9AM-5PM' },
          { day: 'Tuesday', hours: '9AM-5PM' },
          { day: 'Wednesday', hours: '9AM-7PM' },
          { day: 'Thursday', hours: '9AM-5PM' },
          { day: 'Friday', hours: '9AM-5PM' }
        ]
      },
      zipcode: '92620'
    }
  ];
  
  for (const resourceData of initialResources) {
    const resource = await prisma.resource.create({
      data: resourceData
    });
    console.log(`Created resource: ${resource.organization} (${resource.id})`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 
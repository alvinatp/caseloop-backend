import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleResources() {
  try {
    console.log('Connecting to the local database...');
    
    // Sample resources to add
    const sampleResources = [
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
          description: 'Provides emergency food assistance to individuals and families in need.',
          services: ['Food pantry', 'Meal delivery', 'Nutrition education'],
          eligibility: ['Open to all residents', 'No proof of income required'],
          hours: [
            { day: 'Monday', hours: '9AM-5PM' },
            { day: 'Tuesday', hours: '9AM-5PM' },
            { day: 'Wednesday', hours: '9AM-7PM' },
            { day: 'Thursday', hours: '9AM-5PM' },
            { day: 'Friday', hours: '9AM-5PM' }
          ]
        },
        zipcode: '92618'
      },
      {
        organization: 'Community Housing Services',
        program: 'Rental Assistance Program',
        category: 'Housing',
        status: 'LIMITED',
        contactDetails: {
          address: '456 Oak Rd, Anytown, CA 92618',
          phone: '949-555-5678',
          email: 'help@housingservices.org',
          website: 'www.housingservices.org',
          description: 'Offers transitional housing and rental assistance for low-income individuals.',
          services: ['Rental assistance', 'Housing search', 'Eviction prevention'],
          eligibility: ['Income below 50% of AMI', 'Must provide income documentation'],
          hours: [
            { day: 'Monday', hours: '10AM-4PM' },
            { day: 'Tuesday', hours: '10AM-4PM' },
            { day: 'Wednesday', hours: '10AM-4PM' },
            { day: 'Thursday', hours: '10AM-4PM' },
            { day: 'Friday', hours: '10AM-2PM' }
          ]
        },
        zipcode: '92618'
      },
      {
        organization: 'Health Alliance',
        program: 'Mental Health Support',
        category: 'Healthcare',
        status: 'AVAILABLE',
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
      },
      {
        organization: 'Family Support Center',
        program: 'Emergency Assistance',
        category: 'Financial',
        status: 'AVAILABLE',
        contactDetails: {
          address: '321 Pine St, Anytown, CA 92618',
          phone: '949-555-3456',
          email: 'info@familysupport.org',
          website: 'www.familysupport.org',
          description: 'Provides emergency financial assistance and referrals to other resources.',
          services: ['Utility assistance', 'Financial counseling', 'Emergency cash assistance'],
          eligibility: ['Families in crisis', 'Photo ID required', 'Proof of residence'],
          hours: [
            { day: 'Monday', hours: '9AM-4PM' },
            { day: 'Tuesday', hours: '9AM-4PM' },
            { day: 'Wednesday', hours: '9AM-4PM' },
            { day: 'Thursday', hours: '9AM-4PM' },
            { day: 'Friday', hours: '9AM-12PM' }
          ]
        },
        zipcode: '92618'
      },
      {
        organization: 'Legal Aid Society',
        program: 'Housing Justice Project',
        category: 'Legal',
        status: 'AVAILABLE',
        contactDetails: {
          address: '555 Legal Ave, Anytown, CA 92620',
          phone: '949-555-7890',
          email: 'housing@legalaid.org',
          website: 'www.legalaid.org',
          description: 'Provides free legal services for housing-related issues.',
          services: ['Eviction defense', 'Tenant rights workshops', 'Legal consultation'],
          eligibility: ['Income below 200% of federal poverty line', 'Must be county resident'],
          hours: [
            { day: 'Monday', hours: '9AM-5PM' },
            { day: 'Tuesday', hours: '9AM-5PM' },
            { day: 'Wednesday', hours: '9AM-5PM' },
            { day: 'Thursday', hours: '9AM-5PM' },
            { day: 'Friday', hours: '9AM-5PM' }
          ]
        },
        zipcode: '92620'
      }
    ];
    
    // Add each resource to the database
    for (const resourceData of sampleResources) {
      // Check if this resource already exists
      const existingResource = await prisma.resource.findFirst({
        where: {
          organization: resourceData.organization,
          program: resourceData.program
        }
      });
      
      if (existingResource) {
        console.log(`Resource already exists: ${resourceData.organization} - ${resourceData.program}`);
        continue;
      }
      
      // Create the resource
      const resource = await prisma.resource.create({
        data: resourceData
      });
      
      console.log(`Created resource: ${resource.organization} - ${resource.program} (ID: ${resource.id})`);
    }
    
    console.log('Sample resources have been added successfully!');
    
  } catch (error) {
    console.error('Error adding sample resources:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

// Run the function
addSampleResources(); 
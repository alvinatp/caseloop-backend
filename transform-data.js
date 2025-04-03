import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function transformData() {
  try {
    // Get all resources
    const resources = await prisma.resource.findMany();

    // Transform each resource
    for (const resource of resources) {
      let contactDetails = {};
      let notes = [];

      // Transform contactDetails
      try {
        if (typeof resource.contactDetails === 'string') {
          contactDetails = JSON.parse(resource.contactDetails);
        } else if (typeof resource.contactDetails === 'object') {
          contactDetails = resource.contactDetails;
        }

        // Ensure all expected fields exist with proper structure
        contactDetails = {
          address: contactDetails.address || '',
          phone: contactDetails.phone || '',
          email: contactDetails.email || '',
          website: contactDetails.website || '',
          description: contactDetails.description || '',
          services: Array.isArray(contactDetails.services) ? contactDetails.services : [],
          eligibility: Array.isArray(contactDetails.eligibility) ? contactDetails.eligibility : [],
          hours: Array.isArray(contactDetails.hours) ? contactDetails.hours.map(h => ({
            day: h.day || '',
            hours: h.hours || ''
          })) : []
        };
      } catch (e) {
        console.error(`Error parsing contactDetails for resource ${resource.id}:`, e);
        contactDetails = {
          address: '',
          phone: '',
          email: '',
          website: '',
          description: '',
          services: [],
          eligibility: [],
          hours: []
        };
      }

      // Transform notes
      try {
        if (typeof resource.notes === 'string') {
          notes = JSON.parse(resource.notes);
        } else if (Array.isArray(resource.notes)) {
          notes = resource.notes;
        }

        // Ensure each note has the correct structure
        notes = notes.map(note => ({
          userId: note.userId || 0,
          username: note.username || 'Unknown User',
          content: note.content || '',
          timestamp: note.timestamp || new Date().toISOString()
        }));
      } catch (e) {
        console.error(`Error parsing notes for resource ${resource.id}:`, e);
        notes = [];
      }

      // Update the resource with transformed data
      await prisma.resource.update({
        where: { id: resource.id },
        data: {
          contactDetails,
          notes
        }
      });

      console.log(`Transformed resource ${resource.id}`);
    }

    console.log('Data transformation complete!');
  } catch (error) {
    console.error('Error transforming data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

transformData(); 
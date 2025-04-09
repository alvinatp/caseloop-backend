import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listDatabaseContents() {
  try {
    console.log('Connecting to the local database...');
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('\n=== USERS ===');
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.fullName}) - Role: ${user.role}, ID: ${user.id}`);
    });
    
    // List all resources
    const resources = await prisma.resource.findMany({
      select: {
        id: true,
        organization: true,
        program: true,
        category: true,
        status: true
      }
    });
    
    console.log('\n=== RESOURCES ===');
    console.log(`Total resources: ${resources.length}`);
    resources.forEach(resource => {
      console.log(`- ${resource.organization}${resource.program ? ` - ${resource.program}` : ''}`);
      console.log(`  Category: ${resource.category}, Status: ${resource.status}, ID: ${resource.id}`);
    });
    
    // Count resources by category
    const categories = await prisma.resource.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });
    
    console.log('\n=== RESOURCE CATEGORIES ===');
    categories.forEach(cat => {
      console.log(`- ${cat.category}: ${cat._count.category} resources`);
    });
    
    // Count resources by status
    const statuses = await prisma.resource.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    console.log('\n=== RESOURCE STATUSES ===');
    statuses.forEach(stat => {
      console.log(`- ${stat.status}: ${stat._count.status} resources`);
    });
    
  } catch (error) {
    console.error('Error listing database contents:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the function
listDatabaseContents(); 
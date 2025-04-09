import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createLocalAdminUser() {
  try {
    console.log('Connecting to the local database...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }
    
    // Create admin user with password 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        fullName: 'Administrator',
        role: 'ADMIN'
      }
    });
    
    console.log('Created admin user successfully:', adminUser.username);
    
    // Also create a case manager user
    const caseManagerPassword = await bcrypt.hash('casemanager123', 10);
    
    const caseManager = await prisma.user.create({
      data: {
        username: 'casemanager',
        password: caseManagerPassword,
        fullName: 'Case Manager',
        role: 'CASE_MANAGER'
      }
    });
    
    console.log('Created case manager user successfully:', caseManager.username);
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

// Run the function
createLocalAdminUser(); 
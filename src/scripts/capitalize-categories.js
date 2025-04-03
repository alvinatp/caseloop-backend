// Script to capitalize all resource categories in the database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Capitalize each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
function capitalizeWords(str) {
  return str
    .split('-').join(' ') // Replace hyphens with spaces for processing
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Main function to update all categories
 */
async function capitalizeCategoriesInDatabase() {
  try {
    console.log('Fetching all resources...');
    
    // Get all resources
    const resources = await prisma.resource.findMany();
    console.log(`Found ${resources.length} resources.`);
    
    // Keep track of which categories were updated
    const updatedCategories = {};
    
    // Update each resource's category
    console.log('Updating categories...');
    
    for (const resource of resources) {
      const originalCategory = resource.category;
      const capitalizedCategory = capitalizeWords(originalCategory);
      
      // Skip if already capitalized
      if (originalCategory === capitalizedCategory) {
        continue;
      }
      
      // Update the resource
      await prisma.resource.update({
        where: { id: resource.id },
        data: { category: capitalizedCategory }
      });
      
      // Keep track of updates
      if (!updatedCategories[originalCategory]) {
        updatedCategories[originalCategory] = capitalizedCategory;
      }
    }
    
    // Display results
    console.log('\nCategory updates completed:');
    
    if (Object.keys(updatedCategories).length === 0) {
      console.log('No categories needed to be updated.');
    } else {
      console.table(updatedCategories);
      console.log(`Updated ${Object.keys(updatedCategories).length} unique categories.`);
    }
    
  } catch (error) {
    console.error('Error updating categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
capitalizeCategoriesInDatabase(); 
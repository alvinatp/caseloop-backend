// Script to capitalize all resource categories in the database
// Enhanced version that also generates code for the frontend
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

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
 * Standardize formatting for frontend code
 * @param {string} str - The string to format
 * @returns {string} The formatted string for frontend code (kebab-case)
 */
function toFrontendFormat(str) {
  return str.toLowerCase().replace(/ /g, '-');
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
    const uniqueCategories = new Set();
    
    // Update each resource's category
    console.log('Updating categories...');
    
    for (const resource of resources) {
      const originalCategory = resource.category;
      const capitalizedCategory = capitalizeWords(originalCategory);
      
      // Track unique categories for frontend
      uniqueCategories.add(capitalizedCategory);
      
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
    
    // Generate frontend categories array
    console.log('\nAll unique categories in the database:');
    const sortedCategories = Array.from(uniqueCategories).sort();
    console.table(sortedCategories);
    
    // Generate code for frontend
    console.log('\nCategories array for frontend code:');
    const frontendCategoriesArray = sortedCategories.map(cat => `"${toFrontendFormat(cat)}"`);
    console.log(`const categories = [\n  ${frontendCategoriesArray.join(',\n  ')}\n]`);
    
  } catch (error) {
    console.error('Error updating categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
capitalizeCategoriesInDatabase(); 
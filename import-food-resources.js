import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse';
import path from 'path';

const prisma = new PrismaClient();

// Extract zipcode from contact string
function extractZipcode(contactStr) {
  const match = contactStr.match(/\b\d{5}\b/);
  return match ? match[0] : "92000"; // Default to a general OC zipcode if not found
}

// Extract address, phone, email, and website from contact string
function extractContactDetails(contactStr, services, target) {
  const details = {
    address: "",
    phone: "",
    email: "",
    website: "",
    description: `${services}\n\nWho They Serve: ${target}`
  };
  
  // Extract address
  const addressMatch = contactStr.match(/Location:\s*([^,]+,\s*[^,]+,\s*[A-Z]{2}\s*\d{5})/);
  if (addressMatch) {
    details.address = addressMatch[1];
  }
  
  // Extract phone
  const phoneMatch = contactStr.match(/Phone:\s*([0-9-]+(\s*ext\.\s*\d+)?)/);
  if (phoneMatch) {
    details.phone = phoneMatch[1];
  }
  
  // Extract email
  const emailMatch = contactStr.match(/Email:?\s*([^\s]+@[^\s]+\.[^\s]+)/);
  if (emailMatch) {
    details.email = emailMatch[1];
  }
  
  // Extract website
  const websiteMatch = contactStr.match(/Website:\s*([^\s]+\.[^\s]+)/);
  if (websiteMatch) {
    details.website = websiteMatch[1];
  }
  
  return details;
}

async function importResources() {
  console.log("Starting import of food resources from CSV...");
  
  try {
    const csvFilePath = path.join(process.cwd(), 'prisma', 'food findhelp - Sheet1.csv');
    
    // Create a readable stream for the CSV file
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    
    // Parse the CSV file
    parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, async (err, records) => {
      if (err) {
        console.error("Error parsing CSV:", err);
        await prisma.$disconnect();
        return;
      }
      
      console.log(`Found ${records.length} records in CSV file`);
      
      // Create each resource in the database
      for (const record of records) {
        // Skip if program is numbered (likely a header or duplicate)
        if (/^\d+\./.test(record.Program)) {
          record.Program = record.Program.replace(/^\d+\.\s*/, '');
        }
        
        const zipcode = extractZipcode(record['Next Steps / Contact & Location']);
        const contactDetails = extractContactDetails(
          record['Next Steps / Contact & Location'],
          record['Services Offered'],
          record['Who They Serve']
        );
        
        await prisma.resource.create({
          data: {
            organization: record.Organization,
            program: record.Program,
            category: "Food",
            status: "AVAILABLE",
            contactDetails: contactDetails,
            zipcode: zipcode
          }
        });
        
        console.log(`Imported: ${record.Program} - ${record.Organization}`);
      }
      
      console.log("Import completed successfully!");
      await prisma.$disconnect();
    });
  } catch (error) {
    console.error("Error importing resources:", error);
    await prisma.$disconnect();
  }
}

importResources(); 
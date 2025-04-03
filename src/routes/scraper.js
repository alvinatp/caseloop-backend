import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @route POST /api/scraper
 * @desc Run the scraper to fetch resources from findhelp.org
 */
router.post('/', async (req, res) => {
  try {
    const { category, zipcode } = req.body;
    
    if (!category || !zipcode) {
      return res.status(400).json({ message: 'Category and zipcode are required' });
    }
    
    // Run the Python script
    const scriptPath = path.join(__dirname, '..', 'scraper.py');
    console.log(`Running scraper with: ${category}, ${zipcode}`);
    
    const pythonProcess = spawn('python', [scriptPath, category, zipcode]);
    
    let output = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`Scraper output: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Scraper error: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Scraper process exited with code ${code}`);
      
      if (code !== 0) {
        return res.status(500).json({ message: 'Error running scraper', error: output });
      }
      
      // Check if results file exists
      const resultsPath = path.join(__dirname, '..', '..', 'findhelp_results.json');
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        return res.status(200).json({ 
          message: 'Scraping completed successfully',
          count: results.length,
          results
        });
      } else {
        return res.status(404).json({ message: 'No results found' });
      }
    });
  } catch (error) {
    console.error('Error running scraper:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 
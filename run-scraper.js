import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.join(__dirname, 'src', 'scraper.py');

// Default search parameters
const category = process.argv[2] || 'food';
const zipcode = process.argv[3] || '94103';

console.log(`Running scraper with: category=${category}, zipcode=${zipcode}`);

// Run the Python script
const pythonProcess = spawn('python3', [scriptPath, category, zipcode]);

// Log output
pythonProcess.stdout.on('data', (data) => {
  console.log(`${data}`);
});

// Log errors
pythonProcess.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

// Handle process exit
pythonProcess.on('close', (code) => {
  console.log(`Scraper process exited with code ${code}`);
}); 
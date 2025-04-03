import express from 'express';
import {
  getResources,
  getResourceById,
  updateResource,
  searchResources,
  getRecentUpdates,
  createResource,
  importResources,
  saveResource,
  unsaveResource,
  getSavedResources,
  importResourcesFromCSV
} from '../controllers/resourceController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { Role } from '@prisma/client';
import {
  getResourcesRules,
  resourceIdRule,
  updateResourceRules,
  searchResourcesRules,
  getUpdatesRules,
  createResourceRules,
  validate
} from '../middleware/validators.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'csv-import-' + Date.now() + path.extname(file.originalname));
  }
});

// Create the uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: function (req, file, cb) {
    // Only accept CSV files
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// Public Routes
router.get('/', getResourcesRules(), validate, getResources);
router.get('/search', searchResourcesRules(), validate, searchResources);
router.get('/updates', getUpdatesRules(), validate, getRecentUpdates);
router.get('/saved', protect, getSavedResources);

// Protected Routes (Requires Login)
router.post('/:id/save', protect, resourceIdRule(), validate, saveResource);
router.delete('/:id/save', protect, resourceIdRule(), validate, unsaveResource);

// Private Routes (Requires Login)
router.put(
  '/:id',
  protect,
  restrictTo(Role.CASE_MANAGER, Role.ADMIN),
  updateResourceRules(),
  validate,
  updateResource
);

router.post(
  '/:id/notes',
  protect,
  restrictTo(Role.CASE_MANAGER, Role.ADMIN),
  resourceIdRule(),
  validate,
  updateResource
);

router.get('/:id', resourceIdRule(), validate, getResourceById);

// Admin-only Routes
router.post(
  '/create',
  protect,
  restrictTo(Role.CASE_MANAGER, Role.ADMIN),
  createResourceRules(),
  validate,
  createResource
);

router.post(
  '/import',
  protect,
  restrictTo(Role.ADMIN),
  importResources
);

// CSV Import route
router.post('/import-csv', upload.single('file'), importResourcesFromCSV);

export default router; 
import { body, query, param, validationResult } from 'express-validator';
import { Status, Role } from '@prisma/client';

export const registerRules = () => [
  body('username').notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('fullName').optional().isString().withMessage('Full name must be a string'),
  body('role').optional().isIn(Object.values(Role)).withMessage('Invalid role specified'),
];

export const loginRules = () => [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const getResourcesRules = () => [
  query('category').optional().isString().trim(),
  query('status').optional().isIn(Object.values(Status)).withMessage('Invalid status value'),
  query('zipcode').optional().isPostalCode('US').withMessage('Invalid US zipcode format'),
  query('sort').optional().isIn(['lastUpdated', 'name']).withMessage('Invalid sort field'),
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
];

export const resourceIdRule = () => [
  param('id').isInt().withMessage('Resource ID must be an integer').toInt(),
];

export const updateResourceRules = () => [
  param('id').isInt().withMessage('Resource ID must be an integer').toInt(),
  body('status').optional().isIn(Object.values(Status)).withMessage('Invalid status value'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('suggest_removal').optional().isBoolean().toBoolean(),
];

export const createResourceRules = () => [
  body('name').notEmpty().withMessage('Name is required').isString().trim(),
  body('category').notEmpty().withMessage('Category is required').isString().trim(),
  body('zipcode').notEmpty().withMessage('Zipcode is required').isString().trim(),
  body('status').optional().isIn(Object.values(Status)).withMessage('Invalid status value'),
  body('contactDetails').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
      } catch (e) {
        throw new Error('Contact details must be valid JSON');
      }
    } else if (typeof value !== 'object') {
      throw new Error('Contact details must be an object or JSON string');
    }
    return true;
  }),
];

export const searchResourcesRules = () => [
  query('query').notEmpty().withMessage('Search query is required').isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
];

export const getUpdatesRules = () => [
  query('since').optional().isISO8601().toDate().withMessage('Invalid timestamp format for "since" parameter (ISO8601 expected)'),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors,
  });
}; 
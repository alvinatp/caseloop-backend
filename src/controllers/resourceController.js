import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

export const getResources = async (req, res) => {
  const { category, status, zipcode, sort, page = 1, limit = 9 } = req.query;

  const where = {};
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (status) where.status = status;
  if (zipcode) where.zipcode = zipcode;

  const orderBy = {};
  if (sort === 'lastUpdated') orderBy.lastUpdated = 'desc';
  else if (sort === 'name') orderBy.name = 'asc';
  else orderBy.lastUpdated = 'desc';

  const skip = (page - 1) * limit;

  try {
    const resources = await prisma.resource.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    const totalResources = await prisma.resource.count({ where });

    res.json({
      currentPage: page,
      totalPages: Math.ceil(totalResources / limit),
      totalResources,
      resources,
    });
  } catch (error) {
    console.error('Get Resources Error:', error);
    res.status(500).json({ message: 'Server error retrieving resources' });
  }
};

export const getResourceById = async (req, res) => {
  const { id } = req.params;

  try {
    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    console.error('Get Resource By ID Error:', error);
    res.status(500).json({ message: 'Server error retrieving resource' });
  }
};

export const updateResource = async (req, res) => {
  const { id } = req.params;
  const { status, notes: newNoteContent, suggest_removal, contactDetails } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  try {
    const resource = await prisma.resource.findUnique({ where: { id } });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const dataToUpdate = {};
    if (status) dataToUpdate.status = status;
    if (suggest_removal !== undefined) {
      console.log(`User ${userId} suggested removal for resource ${id}`);
      if (suggest_removal === true && !status) {
        dataToUpdate.status = Status.UNAVAILABLE;
      }
    }
    
    // Handle contact details update
    if (contactDetails) {
      dataToUpdate.contactDetails = contactDetails;
    }

    let currentNotes = [];
    if (resource.notes && typeof resource.notes === 'object' && Array.isArray(resource.notes)) {
      currentNotes = resource.notes;
    } else if (typeof resource.notes === 'string') {
      try {
        currentNotes = JSON.parse(resource.notes);
        if (!Array.isArray(currentNotes)) currentNotes = [];
      } catch (e) {
        currentNotes = [];
      }
    }

    if (newNoteContent) {
      const newNote = {
        userId: userId,
        username: username,
        content: newNoteContent,
        timestamp: new Date().toISOString(),
      };
      currentNotes.push(newNote);
      dataToUpdate.notes = currentNotes;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const updatedResource = await prisma.resource.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      message: 'Resource update submitted successfully',
      resource: updatedResource,
    });
  } catch (error) {
    console.error('Update Resource Error:', error);
    res.status(500).json({ message: 'Server error updating resource' });
  }
};

export const searchResources = async (req, res) => {
  const { query, page = 1, limit = 9 } = req.query;

  const skip = (page - 1) * limit;

  try {
    const where = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { zipcode: { contains: query } },
      ],
    };

    const resources = await prisma.resource.findMany({
      where,
      skip,
      take: limit,
      orderBy: { lastUpdated: 'desc' }
    });

    const totalResources = await prisma.resource.count({ where });

    res.json({
      currentPage: page,
      totalPages: Math.ceil(totalResources / limit),
      totalResources,
      resources,
    });
  } catch (error) {
    console.error('Search Resources Error:', error);
    res.status(500).json({ message: 'Server error searching resources' });
  }
};

export const getRecentUpdates = async (req, res) => {
  const { since, page = 1, limit = 15 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (!since) {
    return res.status(400).json({ message: 'The "since" query parameter (ISO8601 timestamp) is required.' });
  }

  try {
    const where = {
      lastUpdated: {
        gt: since,
      },
    };

    const skip = (pageNum - 1) * limitNum;

    const updatedResources = await prisma.resource.findMany({
      where,
      orderBy: {
        lastUpdated: 'desc',
      },
      skip,
      take: limitNum
    });

    const totalResources = await prisma.resource.count({ where });

    res.json({
      resources: updatedResources,
      currentPage: pageNum,
      totalPages: Math.ceil(totalResources / limitNum),
      totalResources
    });
  } catch (error) {
    console.error('Get Recent Updates Error:', error);
    res.status(500).json({ message: 'Server error retrieving recent updates' });
  }
};

export const createResource = async (req, res) => {
  const { 
    name, 
    category, 
    status = 'AVAILABLE', 
    contactDetails, 
    zipcode,
    notes 
  } = req.body;

  if (!name || !category || !zipcode) {
    return res.status(400).json({ 
      message: 'Required fields missing: name, category, and zipcode are required' 
    });
  }

  let parsedContactDetails;
  try {
    if (typeof contactDetails === 'string') {
      parsedContactDetails = JSON.parse(contactDetails);
    } else if (typeof contactDetails === 'object') {
      parsedContactDetails = contactDetails;
    } else {
      parsedContactDetails = { address: '' };
    }
  } catch (error) {
    return res.status(400).json({ 
      message: 'Invalid contactDetails format. Must be valid JSON.' 
    });
  }

  try {
    const resource = await prisma.resource.create({
      data: {
        name,
        category,
        status,
        contactDetails: parsedContactDetails,
        zipcode,
        notes: notes || [],
      }
    });

    res.status(201).json({
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    console.error('Create Resource Error:', error);
    res.status(500).json({ 
      message: 'Server error creating resource',
      error: error.message 
    });
  }
};

export const importResources = async (req, res) => {
  const { resources } = req.body;

  if (!Array.isArray(resources) || resources.length === 0) {
    return res.status(400).json({
      message: 'Invalid request: resources must be a non-empty array'
    });
  }

  try {
    const createdResources = [];
    const errors = [];

    for (const [index, resource] of resources.entries()) {
      try {
        const { 
          name, 
          category, 
          address, 
          phone, 
          website, 
          descriptions, 
          city,
          status = 'AVAILABLE'
        } = resource;

        if (!name || !category) {
          errors.push({
            index,
            message: 'Required fields missing: name and category are required',
            resource
          });
          continue;
        }

        const contactDetails = {
          address: address || '',
          phone: phone || '',
          website: website || '',
          description: descriptions || ''
        };

        let zipcode = '';
        if (address) {
          const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
          zipcode = zipMatch ? zipMatch[0] : (city || '');
        } else {
          zipcode = city || '';
        }

        const createdResource = await prisma.resource.create({
          data: {
            name,
            category,
            status,
            contactDetails,
            zipcode,
            notes: []
          }
        });

        createdResources.push(createdResource);
      } catch (error) {
        errors.push({
          index,
          message: error.message,
          resource
        });
      }
    }

    res.status(201).json({
      message: `Imported ${createdResources.length} resources with ${errors.length} errors`,
      createdCount: createdResources.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import Resources Error:', error);
    res.status(500).json({ 
      message: 'Server error importing resources',
      error: error.message 
    });
  }
};

export const getSavedResources = async (req, res) => {
  const userId = req.user.id;

  try {
    // Use a join query to get all resources saved by the user
    const savedResources = await prisma.resource.findMany({
      where: {
        savedBy: {
          some: {
            userId: userId
          }
        }
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });

    console.log(`Found ${savedResources.length} saved resources for user ${userId}`);
    res.json(savedResources);
  } catch (error) {
    console.error('Get Saved Resources Error:', error);
    res.status(500).json({ message: 'Server error retrieving saved resources' });
  }
};

export const saveResource = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const resourceId = parseInt(id, 10);

  if (isNaN(resourceId)) {
    return res.status(400).json({ message: 'Invalid resource ID format' });
  }

  try {
    // First check if the resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        savedBy: {
          where: {
            userId: userId
          }
        }
      }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // If already saved, return success
    if (resource.savedBy.length > 0) {
      return res.json({ message: 'Resource already saved', resource });
    }

    // Create the saved resource relationship
    const savedResource = await prisma.savedResource.create({
      data: {
        userId: userId,
        resourceId: resourceId
      },
      include: {
        resource: true
      }
    });

    res.json({ message: 'Resource saved successfully', resource: savedResource.resource });
  } catch (error) {
    console.error('Save Resource Error:', error);
    res.status(500).json({ message: 'Server error saving resource' });
  }
};

export const unsaveResource = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const resourceId = parseInt(id, 10);

  if (isNaN(resourceId)) {
    return res.status(400).json({ message: 'Invalid resource ID format' });
  }

  try {
    // First check if the saved resource exists
    const savedResource = await prisma.savedResource.findFirst({
      where: {
        userId: userId,
        resourceId: resourceId
      },
      include: {
        resource: true
      }
    });

    if (!savedResource) {
      return res.status(404).json({ message: 'Saved resource not found' });
    }

    // Delete the saved resource relationship
    await prisma.savedResource.delete({
      where: {
        id: savedResource.id
      }
    });

    res.json({ message: 'Resource unsaved successfully', resource: savedResource.resource });
  } catch (error) {
    console.error('Unsave Resource Error:', error);
    res.status(500).json({ message: 'Server error unsaving resource' });
  }
}; 
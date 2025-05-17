const Resource = require('../models/Resource');
const PathItem = require('../models/PathItem');
const Rating = require('../models/Rating');
const UserProgress = require('../models/UserProgress');

exports.getResourcesByPathItem = async (req, res, next) => {
  try {
    const pathItemExists = await PathItem.findById(req.params.pathItemId);
    if (!pathItemExists) {
        return res.status(404).json({ success: false, message: `PathItem not found with id ${req.params.pathItemId}` });
    }
    const resources = await Resource.find({ pathItem: req.params.pathItemId })
                                    .populate('createdBy', 'username');
    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    console.error("Get Resources By PathItem Error:", error);
    next(error);
  }
};

exports.getResourceById = async (req, res, next) => {
    try {
      const resource = await Resource.findById(req.params.id)
        .populate('pathItem', 'title roadmap')
        .populate('createdBy', 'username');

      if (!resource) {
        return res.status(404).json({ success: false, message: `Resource not found with id ${req.params.id}` });
      }
      res.status(200).json({ success: true, data: resource });
    } catch (error) {
      console.error("Get Resource By ID Error:", error);
      next(error);
    }
};

exports.createResource = async (req, res, next) => {
  const { title, url, type } = req.body;
  const pathItemId = req.params.pathItemId;

  try {
    const pathItem = await PathItem.findById(pathItemId).populate('roadmap');
    if (!pathItem) {
      return res.status(404).json({ success: false, message: `PathItem not found with id ${pathItemId}` });
    }

    const newResource = await Resource.create({
      title,
      url,
      type,
      pathItem: pathItemId,
      createdBy: req.user.id
    });

    pathItem.resources.push(newResource._id);
    await pathItem.save();

    res.status(201).json({ success: true, data: newResource });
  } catch (error) {
    console.error("Create Resource Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.updateResource = async (req, res, next) => {
  const { title, url, type } = req.body;
  try {
    let resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: `Resource not found with id ${req.params.id}` });
    }

    if (resource.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this resource' });
    }

    resource.title = title ?? resource.title;
    resource.url = url ?? resource.url;
    resource.type = type ?? resource.type;

    const updatedResource = await resource.save();
    res.status(200).json({ success: true, data: updatedResource });
  } catch (error) {
    console.error("Update Resource Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: `Resource not found with id ${req.params.id}` });
    }

    if (resource.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this resource' });
    }

    await PathItem.findByIdAndUpdate(resource.pathItem, { $pull: { resources: resource._id } });

    await Rating.deleteMany({ resource: resource._id });
    await UserProgress.deleteMany({ resource: resource._id });

    await resource.deleteOne();

    res.status(200).json({ success: true, message: "Resource and its associated ratings/progress deleted", data: {} });
  } catch (error) {
    console.error("Delete Resource Error:", error);
    next(error);
  }
};
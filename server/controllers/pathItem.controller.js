const PathItem = require('../models/PathItem');
const Roadmap = require('../models/Roadmap');
const Resource = require('../models/Resource');
const Rating = require('../models/Rating');
const UserProgress = require('../models/UserProgress');

exports.getPathItemsByRoadmap = async (req, res, next) => {
  try {
    const roadmapExists = await Roadmap.findById(req.params.roadmapId);
    if (!roadmapExists) {
        return res.status(404).json({ success: false, message: `Roadmap not found with id ${req.params.roadmapId}` });
    }

    const pathItems = await PathItem.find({ roadmap: req.params.roadmapId })
      .populate({
          path: 'resources',
          select: 'title url type avgRating ratingsCount'
      })
      .sort('order');

    res.status(200).json({ success: true, count: pathItems.length, data: pathItems });
  } catch (error) {
    console.error("Get PathItems By Roadmap Error:", error);
    next(error);
  }
};

exports.getPathItemById = async (req, res, next) => {
    try {
      const pathItem = await PathItem.findById(req.params.id)
        .populate('roadmap', 'title')
        .populate({
            path: 'resources',
            select: 'title url type avgRating ratingsCount'
        });

      if (!pathItem) {
        return res.status(404).json({ success: false, message: `PathItem not found with id ${req.params.id}` });
      }
      res.status(200).json({ success: true, data: pathItem });
    } catch (error) {
      console.error("Get PathItem By ID Error:", error);
      next(error);
    }
  };

exports.createPathItem = async (req, res, next) => {
  const { title, description, order } = req.body;
  const roadmapId = req.params.roadmapId;

  try {
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: `Roadmap not found with id ${roadmapId}` });
    }

    let itemOrder = order;
    if (itemOrder === undefined || itemOrder === null) {
        const lastItem = await PathItem.findOne({ roadmap: roadmapId }).sort('-order');
        itemOrder = lastItem ? lastItem.order + 1 : 0;
    }

    const newPathItem = await PathItem.create({
      title,
      description,
      roadmap: roadmapId,
      order: itemOrder
    });

    roadmap.pathItems.push(newPathItem._id);
    await roadmap.save();

    res.status(201).json({ success: true, data: newPathItem });
  } catch (error) {
    console.error("Create PathItem Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.updatePathItem = async (req, res, next) => {
  const { title, description, order } = req.body;
  try {
    let pathItem = await PathItem.findById(req.params.id).populate('roadmap');
    if (!pathItem) {
      return res.status(404).json({ success: false, message: `PathItem not found with id ${req.params.id}` });
    }

    pathItem.title = title ?? pathItem.title;
    pathItem.description = description ?? pathItem.description;
    if (order !== undefined && order !== null) pathItem.order = order;

    const updatedPathItem = await pathItem.save();
    res.status(200).json({ success: true, data: updatedPathItem });
  } catch (error) {
    console.error("Update PathItem Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.deletePathItem = async (req, res, next) => {
  try {
    const pathItem = await PathItem.findById(req.params.id).populate('roadmap');
    if (!pathItem) {
      return res.status(404).json({ success: false, message: `PathItem not found with id ${req.params.id}` });
    }

    if (pathItem.roadmap) {
        await Roadmap.findByIdAndUpdate(pathItem.roadmap._id, { $pull: { pathItems: pathItem._id } });
    }

    const resources = await Resource.find({ pathItem: pathItem._id });
    for (const resource of resources) {
        await Rating.deleteMany({ resource: resource._id });
        await UserProgress.deleteMany({ resource: resource._id });
        await resource.deleteOne();
    }

    await pathItem.deleteOne();

    res.status(200).json({ success: true, message: "PathItem and its associated resources deleted", data: {} });
  } catch (error) {
    console.error("Delete PathItem Error:", error);
    next(error);
  }
};
const Roadmap = require('../models/Roadmap');
const Goal = require('../models/Goal');
const PathItem = require('../models/PathItem');
const UserProgress = require('../models/UserProgress');

exports.getAllRoadmaps = async (req, res, next) => {
  try {
    let query;
    if (req.query.goalId) {
      query = Roadmap.find({ goal: req.query.goalId });
    } else {
      query = Roadmap.find();
    }

    const roadmaps = await query.populate('goal', 'name')
                                .populate('pathItems', 'title');
    res.status(200).json({ success: true, count: roadmaps.length, data: roadmaps });
  } catch (error) {
    console.error("Get All Roadmaps Error:", error);
    next(error);
  }
};

exports.getRoadmapById = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id)
      .populate('goal', 'name description')
      .populate({
        path: 'pathItems',
        select: 'title description order',
        populate: {
          path: 'resources',
          select: 'title url type avgRating ratingsCount'
        },
        options: { sort: { order: 1 } }
      });

    if (!roadmap) {
      return res.status(404).json({ success: false, message: `Roadmap not found with id ${req.params.id}` });
    }
    res.status(200).json({ success: true, data: roadmap });
  } catch (error) {
    console.error("Get Roadmap By ID Error:", error);
    next(error);
  }
};

exports.getRoadmapsByGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findById(req.params.goalId);
        if (!goal) {
            return res.status(404).json({ success: false, message: `Goal not found with id ${req.params.goalId}` });
        }

        const roadmaps = await Roadmap.find({ goal: req.params.goalId })
            .populate('pathItems', 'title');

        res.status(200).json({ success: true, count: roadmaps.length, data: roadmaps });
    } catch (error) {
        console.error("Get Roadmaps By Goal Error:", error);
        next(error);
    }
};

exports.createRoadmap = async (req, res, next) => {
  const { title, description, goalId, tags, estimatedDuration } = req.body;
  try {
    if (goalId) {
      const goalExists = await Goal.findById(goalId);
      if (!goalExists) {
        return res.status(400).json({ success: false, message: `Goal with id ${goalId} not found.` });
      }
    }

    const newRoadmap = await Roadmap.create({
      title,
      description,
      goal: goalId || null,
      tags: tags || [],
      estimatedDuration
    });

    if (goalId) {
        await Goal.findByIdAndUpdate(goalId, { $addToSet: { roadmaps: newRoadmap._id } });
    }

    res.status(201).json({ success: true, data: newRoadmap });
  } catch (error) {
    console.error("Create Roadmap Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.updateRoadmap = async (req, res, next) => {
  const { title, description, goalId, tags, estimatedDuration, pathItemOrder } = req.body;
  try {
    let roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: `Roadmap not found with id ${req.params.id}` });
    }

    const oldGoalId = roadmap.goal ? roadmap.goal.toString() : null;

    if (goalId && goalId.toString() !== oldGoalId) {
      const goalExists = await Goal.findById(goalId);
      if (!goalExists) {
        return res.status(400).json({ success: false, message: `Goal with id ${goalId} not found.` });
      }
    }

    roadmap.title = title ?? roadmap.title;
    roadmap.description = description ?? roadmap.description;
    roadmap.goal = goalId !== undefined ? (goalId || null) : roadmap.goal;
    roadmap.tags = tags ?? roadmap.tags;
    roadmap.estimatedDuration = estimatedDuration ?? roadmap.estimatedDuration;

    if (pathItemOrder && Array.isArray(pathItemOrder)) {
        for (let i = 0; i < pathItemOrder.length; i++) {
            await PathItem.findByIdAndUpdate(pathItemOrder[i], { order: i });
        }
    }

    const updatedRoadmap = await roadmap.save();

    if (goalId !== undefined && goalId !== oldGoalId) {
        if (oldGoalId) {
            await Goal.findByIdAndUpdate(oldGoalId, { $pull: { roadmaps: roadmap._id } });
        }
        if (goalId) {
            await Goal.findByIdAndUpdate(goalId, { $addToSet: { roadmaps: roadmap._id } });
        }
    }

    await updatedRoadmap.populate([{ path: 'goal', select: 'name' }]);

    res.status(200).json({ success: true, data: updatedRoadmap });
  } catch (error) {
    console.error("Update Roadmap Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.deleteRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: `Roadmap not found with id ${req.params.id}` });
    }

    if (roadmap.goal) {
        await Goal.findByIdAndUpdate(roadmap.goal, { $pull: { roadmaps: roadmap._id } });
    }

    const pathItems = await PathItem.find({ roadmap: roadmap._id });
    for (const item of pathItems) {
        await PathItem.findByIdAndDelete(item._id);
    }
    await UserProgress.deleteMany({ roadmap: roadmap._id });

    await roadmap.deleteOne();

    res.status(200).json({ success: true, message: "Roadmap deleted successfully", data: {} });
  } catch (error) {
    console.error("Delete Roadmap Error:", error);
    next(error);
  }
};
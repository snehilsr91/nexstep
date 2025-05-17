const Goal = require('../models/Goal');
const Roadmap = require('../models/Roadmap');

exports.getAllGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find().populate('roadmaps', 'title description');
    res.status(200).json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    console.error("Get All Goals Error:", error);
    next(error);
  }
};

exports.getGoalById = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id).populate({
        path: 'roadmaps',
        select: 'title description tags estimatedDuration',
        populate: {
            path: 'pathItems',
            select: 'title',
            options: { limit: 5 }
        }
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: `Goal not found with id of ${req.params.id}` });
    }
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    console.error("Get Goal By ID Error:", error);
    next(error);
  }
};

exports.createGoal = async (req, res, next) => {
  const { name, description, icon, roadmapIds } = req.body;
  try {
    const newGoal = await Goal.create({ name, description, icon, roadmaps: roadmapIds || [] });
    res.status(201).json({ success: true, data: newGoal });
  } catch (error) {
    console.error("Create Goal Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: "A goal with this name already exists." });
    }
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  const { name, description, icon, roadmapIds } = req.body;
  try {
    let goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, message: `Goal not found with id of ${req.params.id}` });
    }

    goal.name = name ?? goal.name;
    goal.description = description ?? goal.description;
    goal.icon = icon ?? goal.icon;
    if (roadmapIds !== undefined) {
        goal.roadmaps = roadmapIds;
    }

    const updatedGoal = await goal.save();
    await updatedGoal.populate('roadmaps', 'title');

    res.status(200).json({ success: true, data: updatedGoal });
  } catch (error) {
    console.error("Update Goal Error:", error);
     if (error.code === 11000) {
        return res.status(400).json({ success: false, message: "A goal with this name already exists." });
    }
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, message: `Goal not found with id of ${req.params.id}` });
    }
    await goal.deleteOne();
    res.status(200).json({ success: true, message: "Goal deleted successfully", data: {} });
  } catch (error) {
    console.error("Delete Goal Error:", error);
    next(error);
  }
};
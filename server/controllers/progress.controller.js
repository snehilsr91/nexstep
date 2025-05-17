const UserProgress = require('../models/UserProgress');
const Resource = require('../models/Resource');
const PathItem = require('../models/PathItem');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const { calculateGoalProgress } = require('../utils/recommendations');

exports.updateResourceProgress = async (req, res, next) => {
  const { status } = req.body;
  const resourceId = req.params.resourceId;
  const userId = req.user.id;

  try {
    const resource = await Resource.findById(resourceId).populate('pathItem');
    if (!resource || !resource.pathItem) {
      return res.status(404).json({ success: false, message: `Resource or its PathItem not found with id ${resourceId}` });
    }
    const pathItem = await PathItem.findById(resource.pathItem._id).populate('roadmap');
    if (!pathItem || !pathItem.roadmap) {
        return res.status(404).json({ success: false, message: `PathItem's roadmap not found for resource ${resourceId}` });
    }

    let progress = await UserProgress.findOne({ user: userId, resource: resourceId });

    if (progress) {
      progress.status = status;
      await progress.save();
    } else {
      progress = await UserProgress.create({
        user: userId,
        resource: resourceId,
        pathItem: resource.pathItem._id,
        roadmap: pathItem.roadmap._id,
        status,
      });
    }
    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error("Update Resource Progress Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.getUserProgressForRoadmap = async (req, res, next) => {
  const roadmapId = req.params.roadmapId;
  const userId = req.user.id;

  try {
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
        return res.status(404).json({ success: false, message: `Roadmap not found with id ${roadmapId}` });
    }

    const pathItemsInRoadmap = await PathItem.find({ roadmap: roadmapId }).select('_id title order');
    const pathItemIds = pathItemsInRoadmap.map(item => item._id);

    const resourcesInRoadmap = await Resource.find({ pathItem: { $in: pathItemIds } }).select('_id title pathItem');

    const progressRecords = await UserProgress.find({
      user: userId,
      resource: { $in: resourcesInRoadmap.map(r => r._id) },
    }).select('resource status completedAt');

    const progressMap = {};
    progressRecords.forEach(p => {
        progressMap[p.resource.toString()] = { status: p.status, completedAt: p.completedAt };
    });

    let totalResources = 0;
    let completedResources = 0;

    const roadmapProgressDetails = pathItemsInRoadmap
        .sort((a, b) => a.order - b.order)
        .map(item => {
            const itemResources = resourcesInRoadmap
                .filter(r => r.pathItem.toString() === item._id.toString())
                .map(r => {
                    totalResources++;
                    const status = progressMap[r._id.toString()]?.status || 'incomplete';
                    if (status === 'completed') completedResources++;
                    return {
                        _id: r._id,
                        title: r.title,
                        status: status,
                        completedAt: progressMap[r._id.toString()]?.completedAt
                    };
                });
            return {
                _id: item._id,
                title: item.title,
                order: item.order,
                resources: itemResources,
                completedCount: itemResources.filter(r => r.status === 'completed').length,
                totalCount: itemResources.length
            };
    });

    res.status(200).json({
        success: true,
        data: {
            roadmapId: roadmap._id,
            roadmapTitle: roadmap.title,
            overallProgress: totalResources > 0 ? (completedResources / totalResources) * 100 : 0,
            completedResources,
            totalResources,
            pathItems: roadmapProgressDetails
        }
    });
  } catch (error) {
    console.error("Get User Progress For Roadmap Error:", error);
    next(error);
  }
};

exports.getUserGoalProgressSummary = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId).populate('currentGoal');
        if (!user || !user.currentGoal) {
            return res.status(400).json({ success: false, message: 'User has no current goal selected or user not found.' });
        }

        const goalProgress = await calculateGoalProgress(userId, user.currentGoal._id);

        res.status(200).json({ success: true, data: goalProgress });

    } catch (error) {
        console.error("Get User Goal Progress Summary Error:", error);
        next(error);
    }
};

exports.getUserProgressForPathItem = async (req, res, next) => {
    const pathItemId = req.params.pathItemId;
    const userId = req.user.id;

    try {
        const pathItem = await PathItem.findById(pathItemId);
        if (!pathItem) {
            return res.status(404).json({ success: false, message: `PathItem not found with id ${pathItemId}` });
        }

        const resourcesInPathItem = await Resource.find({ pathItem: pathItemId }).select('_id title');
        const resourceIds = resourcesInPathItem.map(r => r._id);

        const progressRecords = await UserProgress.find({
            user: userId,
            resource: { $in: resourceIds }
        }).select('resource status completedAt');

        const progressMap = {};
        progressRecords.forEach(p => {
            progressMap[p.resource.toString()] = { status: p.status, completedAt: p.completedAt };
        });

        let completedCount = 0;
        const resourcesWithStatus = resourcesInPathItem.map(r => {
            const status = progressMap[r._id.toString()]?.status || 'incomplete';
            if (status === 'completed') completedCount++;
            return {
                _id: r._id,
                title: r.title,
                status: status,
                completedAt: progressMap[r._id.toString()]?.completedAt
            };
        });

        res.status(200).json({
            success: true,
            data: {
                pathItemId: pathItem._id,
                pathItemTitle: pathItem.title,
                completedCount,
                totalCount: resourcesInPathItem.length,
                progressPercentage: resourcesInPathItem.length > 0 ? (completedCount / resourcesInPathItem.length) * 100 : 0,
                resources: resourcesWithStatus
            }
        });

    } catch (error) {
        console.error("Get User Progress For PathItem Error:", error);
        next(error);
    }
};
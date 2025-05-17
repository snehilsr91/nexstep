const UserProgress = require('../models/UserProgress');
const Roadmap = require('../models/Roadmap');
const Goal = require('../models/Goal');
const PathItem = require('../models/PathItem');

exports.getCareerRecommendations = async (userId) => {
  try {
    const userProgressRecords = await UserProgress.find({ user: userId, status: 'completed' })
      .populate({
        path: 'roadmap',
        select: 'title goal tags estimatedDuration',
        populate: {
            path: 'goal',
            select: 'name'
        }
      })
      .populate({
          path: 'pathItem',
          select: 'title'
      });

    if (!userProgressRecords || userProgressRecords.length === 0) {
      return {
        message: "Not enough data to provide recommendations. Start completing some roadmap items!",
        recommendations: []
      };
    }

    const goalCompletionCounts = {};
    const tagCompletionCounts = {};

    for (const progress of userProgressRecords) {
      if (progress.roadmap && progress.roadmap.goal && progress.roadmap.goal.name) {
        const goalName = progress.roadmap.goal.name;
        goalCompletionCounts[goalName] = (goalCompletionCounts[goalName] || 0) + 1;
      }
      if (progress.roadmap && progress.roadmap.tags) {
        progress.roadmap.tags.forEach(tag => {
          tagCompletionCounts[tag] = (tagCompletionCounts[tag] || 0) + 1;
        });
      }
    }

    let sortedGoals = Object.entries(goalCompletionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    let sortedTags = Object.entries(tagCompletionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    const recommendations = [];
    if (sortedGoals.length > 0) {
      for (let i = 0; i < Math.min(3, sortedGoals.length); i++) {
         const goalDetail = await Goal.findOne({ name: sortedGoals[i].name }).select('name description');
         if (goalDetail) {
            recommendations.push({
                type: 'goal',
                name: goalDetail.name,
                description: goalDetail.description,
                reason: `You've completed ${sortedGoals[i].count} items related to roadmaps in this goal.`,
                insights: `Careers in ${goalDetail.name} often require skills X, Y, Z and have an average salary of $ABC. Current demand is high.`
            });
         }
      }
    } else if (sortedTags.length > 0) {
        recommendations.push({
            type: 'area',
            name: `Focus on ${sortedTags[0].name}`,
            reason: `You've completed ${sortedTags[0].count} items tagged with '${sortedTags[0].name}'. Consider exploring careers related to this skill.`,
            insights: `Skills like ${sortedTags[0].name} are valuable in various tech roles.`
        });
    }

    if (recommendations.length === 0) {
      return {
        message: "Keep learning! Explore more roadmaps to get personalized career recommendations.",
        recommendations: []
      };
    }

    return {
        message: "Here are some career paths you might be interested in based on your learning:",
        recommendations
    };

  } catch (error) {
    console.error("Error generating career recommendations:", error);
    throw new Error("Could not generate career recommendations.");
  }
};

exports.calculateGoalProgress = async (userId, goalId) => {
    const goal = await Goal.findById(goalId).populate('roadmaps');
    if (!goal || !goal.roadmaps || goal.roadmaps.length === 0) {
        return { totalItems: 0, completedItems: 0, percentage: 0, strengths: [], weaknesses: [] };
    }

    let totalResourcesInGoal = 0;
    let completedResourcesInGoal = 0;
    const pathItemProgress = {};

    for (const roadmap of goal.roadmaps) {
        const pathItems = await PathItem.find({ roadmap: roadmap._id }).populate('resources');

        for (const item of pathItems) {
            totalResourcesInGoal += item.resources.length;
            pathItemProgress[item.title] = { total: item.resources.length, completed: 0 };

            for (const resource of item.resources) {
                const progress = await UserProgress.findOne({
                    user: userId,
                    resource: resource._id,
                    status: 'completed'
                });
                if (progress) {
                    completedResourcesInGoal++;
                    pathItemProgress[item.title].completed++;
                }
            }
        }
    }

    const strengths = [];
    const weaknesses = [];
    for (const [itemName, progress] of Object.entries(pathItemProgress)) {
        const itemCompletion = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
        if (itemCompletion >= 75) strengths.push(`${itemName} (Completed ${progress.completed}/${progress.total})`);
        else if (itemCompletion < 50 && progress.total > 0) weaknesses.push(`${itemName} (Completed ${progress.completed}/${progress.total})`);
    }

    return {
        goalName: goal.name,
        totalItems: totalResourcesInGoal,
        completedItems: completedResourcesInGoal,
        percentage: totalResourcesInGoal > 0 ? (completedResourcesInGoal / totalResourcesInGoal) * 100 : 0,
        strengths,
        weaknesses
    };
};
const Module = require('../models/Module');
const Course = require('../models/Course');

// Helper: Check if user is course instructor or admin
const canManageCourse = async (courseId, userId, userRole) => {
  if (userRole === 'super_admin' || userRole === 'institution_admin') return true;
  const course = await Course.findById(courseId);
  return course && course.instructor.toString() === userId.toString();
};

// GET /api/courses/:courseId/modules — Get all modules for a course
exports.getModules = async (req, res) => {
  try {
    const modules = await Module.find({ course: req.params.courseId })
      .populate({
        path: 'lessons',
        select: 'title contentType duration order isPublished',
        options: { sort: { order: 1 } },
      })
      .sort({ order: 1 });

    res.json({ modules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/courses/:courseId/modules — Create a module
exports.createModule = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check permission
    const authorized = await canManageCourse(courseId, req.user._id, req.user.role);
    if (!authorized) {
      return res.status(403).json({ error: 'Not authorized to add modules to this course' });
    }

    // Auto-assign order (put at end)
    const lastModule = await Module.findOne({ course: courseId })
      .sort({ order: -1 });
    const order = lastModule ? lastModule.order + 1 : 1;

    const module = await Module.create({
      course: courseId,
      title: req.body.title,
      description: req.body.description || '',
      order,
    });

    // Add module to course
    await Course.findByIdAndUpdate(courseId, {
      $push: { modules: module._id },
    });

    res.status(201).json({
      message: 'Module created successfully',
      module,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/modules/:id — Update a module
exports.updateModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const authorized = await canManageCourse(module.course, req.user._id, req.user.role);
    if (!authorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, description, isPublished } = req.body;
    if (title !== undefined) module.title = title;
    if (description !== undefined) module.description = description;
    if (isPublished !== undefined) module.isPublished = isPublished;

    await module.save();

    res.json({
      message: 'Module updated successfully',
      module,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/modules/:id — Delete a module
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const authorized = await canManageCourse(module.course, req.user._id, req.user.role);
    if (!authorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Remove from course
    await Course.findByIdAndUpdate(module.course, {
      $pull: { modules: module._id },
    });

    await Module.findByIdAndDelete(req.params.id);

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/modules/reorder — Reorder modules (drag and drop)
exports.reorderModules = async (req, res) => {
  try {
    const { moduleIds, orders } = req.body; // arrays of same length

    const firstModule = await Module.findById(moduleIds[0]);
    if (!firstModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const authorized = await canManageCourse(firstModule.course, req.user._id, req.user.role);
    if (!authorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update each module's order
    for (let i = 0; i < moduleIds.length; i++) {
      await Module.findByIdAndUpdate(moduleIds[i], { order: orders[i] });
    }

    res.json({ message: 'Modules reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
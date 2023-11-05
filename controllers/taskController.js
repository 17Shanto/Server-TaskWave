const Task = require("../models/taskModel");
const List = require("../models/listModel");
const mongoose = require("mongoose");
/**
 * Create a new task within a list.
 * @function
 * @async
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */

exports.createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Could not create task", error: error });
  }
};

/**
 * Get all tasks within a list.
 * @function
 * @async
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */

exports.getAllTasks = async (req, res) => {
  const { listId } = req.params;
  try {
    const tasks = await Task.find({ list: listId });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch tasks", error: error });
  }
};

/**
 * Get a single task by ID.
 * @function
 * @async
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */
exports.getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found", error: error });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch the task" });
  }
};

/**
 * Update a task by ID.
 * @function
 * @async
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  console.log("hitted");
  console.log(req.body, req.params);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const findTask = await Task.findOne({ _id: id });
    if (!findTask) {
      return res.status(404).json({ error: "Task not found" });
    }
    const oldListid = findTask?.list;
    if (req?.body?.list) {
      const removeTaskFromOldList = await List.findOneAndUpdate(
        { _id: oldListid },
        {
          $pull: {
            tasks: findTask?._id,
          },
        },
        { session }
      );
      if (!removeTaskFromOldList) {
        return res
          .status(404)
          .json({ error: "task not remove from old list id" });
      }
      const pushTaskIdTonewList = await List.findOneAndUpdate(
        { _id: req?.body?.list },
        {
          $addToSet: {
            tasks: findTask?._id,
          },
        },
        { session }
      );
      if (!pushTaskIdTonewList) {
        return res.status(404).json({ error: "task not pushed " });
      }
    }

    const task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      session,
    });
    console.log("task", task);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Could not update the task", error: error });
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Delete a task by ID.
 * @function
 * @async
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */
exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findByIdAndRemove(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).json();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Could not delete the task", error: error });
  }
};

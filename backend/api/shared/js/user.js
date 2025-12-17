const express = require("express");
const UserNode = require("../../../classes/driver/js/UserNode");

const router = express.Router();
const user = new UserNode();

// GET /api/user (all users)
router.get("/", async (req, res) => {
  try {
    const users = await user.getAll();
    return res.json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// GET /api/user/:id
router.get("/:id", async (req, res) => {
  try {
    const found = await user.getById(req.params.id);
    if (!found) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }
    return res.json({
      success: true,
      message: "User retrieved successfully",
      data: found,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// POST /api/user
router.post("/", async (req, res) => {
  try {
    const { username, password, email, role, status } = req.body;
    if (!username || !password || !email) {
      return res.json({
        success: false,
        message: "Missing required fields (username, password, email)",
      });
    }
    const created = await user.create({ username, password, email, role, status });
    if (!created) {
      return res.json({
        success: false,
        message: "Failed to create user",
      });
    }
    return res.json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
});

// PUT /api/user
router.put("/", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({
        success: false,
        message: "User ID is required",
      });
    }
    const updated = await user.update(req.body);
    if (!updated) {
      return res.json({
        success: false,
        message: "Failed to update user",
      });
    }
    return res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
});

// DELETE /api/user/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.json({
        success: false,
        message: "User ID is required",
      });
    }
    const deleted = await user.delete(id);
    if (!deleted) {
      return res.json({
        success: false,
        message: "Failed to delete user",
      });
    }
    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
});

module.exports = router;

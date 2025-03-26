const express = require("express");
const { authenticateUser, isAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/admin-only", authenticateUser, isAdmin, (req, res) => {
    res.json({ message: "Welcome Admin! You have access to this route." });
});

module.exports = router;

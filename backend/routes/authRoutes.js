const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// **User Registration Route**
router.post("/register", async (req, res) => {
    console.log("Register endpoint hit");
    const { name, email, password, role } = req.body;  // Accept role from frontend
    try {
        console.log("Checking if user exists");
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            console.log("User already exists");
            return res.status(400).json({ message: "User already exists" });
        }

        console.log("Hashing password");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Default role to 'user' if not provided
        const userRole = role || 'user';

        console.log("Saving user to database");
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hashedPassword, userRole]
        );

        // Generate JWT Token
        const token = jwt.sign(
            { id: newUser.rows[0].id, role: newUser.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("User registered successfully");
        // ✅ Include token in response
        res.status(201).json({
            message: "User registered successfully",
            user: newUser.rows[0],
            token  // <-- Add token here
        });

    } catch (err) {
        console.error("Error during registration:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// **User Login Route**
router.post("/login", async (req, res) => {
    console.log("Login endpoint hit");
    const { email, password } = req.body;

    try {
        console.log("Checking if user exists");
        // Check if the user exists
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            console.log("Invalid email or password");
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("Comparing passwords");
        // Compare passwords
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            console.log("Invalid email or password");
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("Generating JWT token");
        // Generate JWT Token
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        console.log("Login successful");
        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ message: "Server Error", error });
    }
});

// **Protected Route**
const { authenticateUser, isAdmin } = require("../middleware/authMiddleware");

router.get("/protected", authenticateUser, (req, res) => {
  res.json({ message: "Protected route accessed successfully" });
});

router.get("/admin-only", authenticateUser, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin! You have access to this route." });
});

module.exports = router;
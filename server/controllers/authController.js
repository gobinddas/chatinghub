const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileId = Math.random().toString(36).substring(2, 8);

    db.query(
      "INSERT INTO users (username, profile_id, email, password) VALUES (?, ?, ?, ?)",
      [username, profileId, email, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "User registered successfully" });
      },
    );
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0) return res.status(404).json("User not found");

      const user = results[0];

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json("Wrong password");

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

      res.json({ user, token });
    },
  );
};

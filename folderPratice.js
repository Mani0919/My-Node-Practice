const fs = require("fs");
const path = require("path");
const express = require("express");
const api = express();
const PORT = 2000;
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

const dir = path.join(__dirname, "pratice");

api.post("/api/create", (req, res) => {
  try {
    const { foldername } = req.body;
    if (!foldername)
      return res.status(400).json({ err: "folder name is required" });
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      res.status(200).json({ message: "folder created" });
    }
  } catch (error) {}
});

api.post("/api/write", (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ message: "message is required" });
    const filePath = path.join(dir, "message.txt");
    fs.writeFileSync(filePath, message);
    res.json({ message: "message saved successfully" });
  } catch (error) {}
});
api.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

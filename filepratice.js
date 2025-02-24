const fs = require("fs");
const express = require("express");
const api = express();

const PORT = 5000;

api.use(express.json());
api.use(express.urlencoded({ extended: true }));
api.post("/api/upload", (req, res) => {
  const { message } = req.body;
  try {
    if (!message)
      return res.status(400).json({ message: "Please enter a message" });
    if (message.length < 10)
      return res
        .status(400)
        .json({ message: "Message should be atleast 10 characters long" });
    fs.writeFileSync("message.txt", message, (err) => {
      if (err) throw err;
      console.log("File has been created!");
    });
    res.json({ message: "Message saved successfully" });
  } catch (error) {
    console.log(error);
  }
});
api.get("/api/read", (req, res) => {
  try {
    const message = fs.readFileSync("message.txt", "utf-8");
    res.json({ message });
  } catch (error) {
    res.status(404).json({ message: "File not found" });
  }
});
api.put("/api/update", (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });
    if (message.length < 10)
      return res
        .status(400)
        .json({ message: "Message should be atleast 10 characters long" });
    fs.appendFile("message.txt", `\r\n${message}`, (err) => {
      if (err) throw err;
    });
    res.json({ message: "Message updated successfully" });
  } catch (error) {}
});
api.delete("/api/delete", (req, res) => {
  try {
    fs.unlinkSync("message.txt");
    res.json({ message: "file delete successfully" });
  } catch (error) {
    res.status(404).json({ message: "File not found" });
  }
});
api.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

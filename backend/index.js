
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
connectDB();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", require("./routes/authRoutes.js"));

app.listen(9000, () => {
  console.log("Server running on port 9000");
});

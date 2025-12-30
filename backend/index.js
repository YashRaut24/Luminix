const express = require("express");
const connectDB = require("./config/db.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.use(cookieParser());


app.use(cors({
  origin: "http://localhost:5174",
  credentials: true
}));

app.use(express.json());
connectDB();

app.use("/", require("./routes/authRoutes.js"));

app.listen(9000, () => {
  console.log("Server running on port 9000");
});

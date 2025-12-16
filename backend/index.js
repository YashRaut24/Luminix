const express = require("express");
const connectDB = require("./config/db.js");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
connectDB();

app.use("/", require("./routes/authRoutes.js"));

app.listen(9000, () => {
  console.log("Server running on port 9000");
});

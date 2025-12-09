let express = require("express");
let cors = require("cors");
let { MongoClient, ObjectId } = require("mongodb");
let multer = require("multer");
let path = require("path");
let fs = require("fs");

let app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

let url = "mongodb://0.0.0.0:27017";

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
let upload = multer({ storage });

app.post("/signup", async (req, res) => {
  try {
    let client = new MongoClient(url);
    await client.connect();
    let db = client.db("luminix");
    let users = db.collection("users");

    const existingUser = await users.findOne({ email: req.body.email });
    if (existingUser) return res.status(400).send({ error: "Email already registered" });

    await users.insertOne({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    res.send({ message: "User signed up successfully!" });
    await client.close();
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send({ error: "Failed to sign up" });
  }
});

app.post("/signin", async (req, res) => {
  try {
    let client = new MongoClient(url);
    await client.connect();
    let db = client.db("luminix");
    let users = db.collection("users");

    let { email, password } = req.body;
    const user = await users.findOne({ email });
    if (!user) return res.status(404).send({ error: "User not found" });
    if (user.password !== password)
      return res.status(401).send({ error: "Incorrect password" });

    res.send({ message: "Login successful!", user });
    await client.close();
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).send({ error: "Failed to sign in" });
  }
});

app.post("/post", upload.single("image"), async (req, res) => {
  try {
    let client = new MongoClient(url);
    await client.connect();
    let db = client.db("luminix");
    let posts = db.collection("posts");

    let parsedTags = [];
    try {
      parsedTags = JSON.parse(req.body.tags);
    } catch (e) {
      parsedTags = [];
    }

    let newPost = {
      username: req.body.username,
      email: req.body.email,
      caption: req.body.caption,
      target: req.body.target,
      tags: parsedTags,
      postType: req.body.postType,
      file_name: req.file.filename,
      file_url: `http://localhost:9000/uploads/${req.file.filename}`,
      upload_time: new Date(),
    };

    await posts.insertOne(newPost);
    res.send({ message: "Post uploaded successfully!" });
    await client.close();
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).send({ error: "Failed to upload post" });
  }
});

app.get("/files", async (req, res) => {
  const email = req.query.email; 
  try {
    let client = new MongoClient(url);
    await client.connect();
    let db = client.db("luminix");
    let posts = db.collection("posts");

    const files = await posts
      .find({
        $or: [
          { target: "public" },
          { target: "private", email: email },
        ],
      })
      .toArray();

    res.json(files);
    await client.close();
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ message: "Error fetching files" });
  }
});



app.delete("/delete/:id", async (req, res) => {
  try {
    let client = new MongoClient(url);
    await client.connect();
    let db = client.db("luminix");
    let posts = db.collection("posts");

    const post = await posts.findOne({ _id: new ObjectId(req.params.id) });
    if (post && post.file_name) {
      const filePath = path.join(__dirname, "uploads", post.file_name);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await posts.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send({ message: "Post deleted successfully!" });
    await client.close();
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).send({ error: "Failed to delete post" });
  }
});

app.listen(9000, () => console.log("Server running on port 9000"));

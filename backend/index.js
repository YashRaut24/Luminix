let express = require("express");
let cors = require("cors");
let { MongoClient } = require("mongodb");

let app = express();
app.use(cors());
app.use(express.json());

let url = "mongodb://0.0.0.0:27017";

// =============== SIGNUP ==================
app.post("/signup", async (req, res) => {
  try {
    let client = new MongoClient(url);
    await client.connect();

    let db = client.db("luminix");
    let users = db.collection("users");

    // check if email already exists
    const existingUser = await users.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({ error: "Email already registered" });
    }

    let data = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password, // plain text for now
    };

    await users.insertOne(data);
    res.send({ message: "User signed up successfully!" });

    await client.close();
  } catch (error) {
    console.error("Error inserting user:", error);
    res.status(500).send({ error: "Failed to sign up" });
  }
});

// =============== SIGNIN ==================
app.post("/signin", async (req, res) => {
  try {
    let client = new MongoClient(url);
    await client.connect();

    let db = client.db("luminix");
    let users = db.collection("users");

    let { email, password } = req.body;

    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).send({ error: "Incorrect password" });
    }

    res.send({ message: "Login successful!", user });

    await client.close();
  } catch (error) {
    console.error("Error during signin:", error);
    res.status(500).send({ error: "Failed to sign in" });
  }
});

// =============== GET USERS (for testing) ==================
app.get("/users", async (req, res) => {
  try {
    let client = new MongoClient(url);
    await client.connect();

    let db = client.db("luminix");
    let users = db.collection("users");

    let allUsers = await users.find().toArray();
    res.send(allUsers);

    await client.close();
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch users" });
  }
});

app.listen(9000, () => console.log("Server running on port 9000"));

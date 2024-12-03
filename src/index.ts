import express from "express";
import { MongoClient, ObjectId } from "mongodb";

// Basic app config
const app = express();
const port = 3000;
app.use(express.json());

// Database config
const mongoUrl = "mongodb://localhost:27017";
const dbName = "typescript-project-database";
const collectionName = "typescript-project-collection";
const client = new MongoClient(mongoUrl);

async function main() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log("Connected to MongoDB");

    // POST request to insert an object
    app.post("/", async (req, res) => {
      try {
        const result = await collection.insertOne(req.body);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send(error);
      }
    });

    // GET request to retrieve an object by ID
    app.get("/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const object = await collection.findOne({
          _id: new ObjectId(id),
        });
        if (object) {
          res.status(200).send(object);
        } else {
          res.status(404).send("Object not found");
        }
      } catch (error) {
        res.status(500).send(error);
      }
    });

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

main().catch(console.error);

import express from "express";
import { MongoClient } from "mongodb";
import { RequestHandler } from "./handlers/requestHandler";
import { DB_NAME, MONGO_URL, PORT } from "./constants";

const app = express();
app.use(express.json());
const client: MongoClient = new MongoClient(MONGO_URL);

async function main() {
  try {
    // Connect to DB
    await client.connect();
    console.log("Connected to MongoDB");

    // Define request handlers
    const requestHandler: RequestHandler = new RequestHandler(client, DB_NAME);
    app.post("/", (req, res) => requestHandler.insertObject(req, res));
    app.get("/", (req, res) => requestHandler.retrieveAllObjects(req, res));
    app.get("/:id", (req, res) => requestHandler.retrieveObject(req, res));
    app.patch("/:id", (req, res) => requestHandler.updateObject(req, res));
    app.delete("/:id", (req, res) => requestHandler.deleteObject(req, res));

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("An error occurred while handling request", error);
  }
}

main().catch(console.error);

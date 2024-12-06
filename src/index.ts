import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { RequestHandler } from "./requestHandler";
import { DB_NAME, MONGO_URL, PORT } from "./constants";
import { authenticateToken } from "./auth";

const app = express();
app.use(express.json());
app.use(cors());
const client: MongoClient = new MongoClient(MONGO_URL);

async function main() {
  try {
    // Connect to DB
    await client.connect();
    console.log("Connected to MongoDB");

    // Define request handlers
    const requestHandler: RequestHandler = new RequestHandler(client, DB_NAME);
    app.post("/users", (req, res) => requestHandler.createUser(req, res));
    app.post("/login", (req, res) => requestHandler.loginUser(req, res));

    // Protected routes
    app.use(authenticateToken);
    app.get("/users/:username", (req, res) => requestHandler.getUser(req, res));
    app.patch("/users/:username", (req, res) =>
      requestHandler.updateUser(req, res),
    );
    app.delete("/users/:username", (req, res) =>
      requestHandler.deleteUser(req, res),
    );
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

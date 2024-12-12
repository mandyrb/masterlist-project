import dotenv from "dotenv";
dotenv.config();
import { Request, Response } from "express";
import { MongoClient, Db, ObjectId } from "mongodb";
import {
  LIST_COLLECTION,
  LIST_TEST_COLLECTION,
  USER_COLLECTION,
  USER_TEST_COLLECTION,
} from "./constants";
import { MasterList, StoryMood } from "./types";
import { isMasterListCreateRequest } from "./utils";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

export class RequestHandler {
  private db: Db;
  private openai: OpenAI;

  constructor(client: MongoClient, dbName: string) {
    this.db = client.db(dbName);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).send("Username and password are required");
        return;
      }

      const collection = this.db.collection(
        req.query.test === "true" ? USER_TEST_COLLECTION : USER_COLLECTION,
      );
      const existingUser = await collection.findOne({ username });
      if (existingUser) {
        res.status(409).send("Username already exists");
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = { username, passwordHash };
      const result = await collection.insertOne(user);
      if (!result.insertedId)
        throw new Error(
          `An error occurred while trying to create user with username ${username}`,
        );
      res.status(201).send({ username });
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const collection = this.db.collection(
        req.query.test === "true" ? USER_TEST_COLLECTION : USER_COLLECTION,
      );
      const user = await collection.findOne({ username });
      if (!user) {
        res.status(404).send(`User with username ${username} not found`);
        return;
      }
      res.status(200).send(user);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const { password } = req.body;
      const collection = this.db.collection(
        req.query.test === "true" ? USER_TEST_COLLECTION : USER_COLLECTION,
      );
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await collection.updateOne(
        { username },
        { $set: { passwordHash } },
      );
      if (result.matchedCount === 0) {
        res.status(404).send(`User with username ${username} not found`);
        return;
      }
      res.status(200).send(`User with username ${username} updated`);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const collection = this.db.collection(
        req.query.test === "true" ? USER_TEST_COLLECTION : USER_COLLECTION,
      );
      const result = await collection.deleteOne({ username });
      if (result.deletedCount === 0) {
        res.status(404).send(`User with username ${username} not found`);
        return;
      }
      res.status(200).send(`User with username ${username} deleted`);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).send("Username and password are required");
        return;
      }

      const collection = this.db.collection(
        req.query.test === "true" ? USER_TEST_COLLECTION : USER_COLLECTION,
      );
      const user = await collection.findOne({ username });
      if (!user) {
        res.status(401).send("Invalid username or password");
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).send("Invalid username or password");
        return;
      }

      const token = jwt.sign({ username }, String(process.env.AUTH_KEY), {
        expiresIn: "1h",
      });
      res.status(200).send({ token });
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async insertObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(
        req.query.test === "true" ? LIST_TEST_COLLECTION : LIST_COLLECTION,
      );
      if (!isMasterListCreateRequest(req.body)) {
        res
          .status(400)
          .send("Bad request: body must contain fields 'name' and 'items'");
      } else if (!req.user) {
        res
          .status(403)
          .send("Forbidden: request must come from an authenticated user");
      } else {
        const list: MasterList = {
          ...req.body,
          createdDate: new Date(),
          modifiedDate: new Date(),
          username: req.user.username,
          suggestions: await this.generateItemSuggestions(req.body),
          pinned: false,
        };
        const result = await collection.insertOne(list);
        res.status(201).send({ ...list, _id: result.insertedId });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async retrieveObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(
        req.query.test === "true" ? LIST_TEST_COLLECTION : LIST_COLLECTION,
      );
      if (req.params.id.length !== 24) {
        res
          .status(400)
          .send("The id provided must be a string with 24 characters");
      } else if (!req.user) {
        res
          .status(403)
          .send("Forbidden: request must come from an authenticated user");
      } else {
        const object = await collection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (object) {
          if (object.username === req.user.username) {
            res.status(200).send(object);
          } else {
            res
              .status(401)
              .send(
                `User ${req.user.username} is not authorized to retrieve object with id ${req.params.id}`,
              );
          }
        } else {
          res.status(404).send(`Object with id ${req.params.id} not found`);
        }
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async retrieveStory(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(
        req.query.test === "true" ? LIST_TEST_COLLECTION : LIST_COLLECTION,
      );
      if (req.params.id.length !== 24) {
        res
          .status(400)
          .send("The id provided must be a string with 24 characters");
      } else if (!req.user) {
        res
          .status(403)
          .send("Forbidden: request must come from an authenticated user");
      } else {
        const object = await collection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (object) {
          if (object.username === req.user.username) {
            let mood: StoryMood;
            if (req.query.mood) {
              if (
                Object.values(StoryMood).includes(req.query.mood as StoryMood)
              ) {
                const story: string = await this.generateStoryFromList(
                  object as MasterList,
                  req.query.mood as StoryMood,
                );
                res.status(200).send(story);
              } else {
                res
                  .status(400)
                  .send(
                    `Invalid mood value provided. Valid options include: ${Object.values(
                      StoryMood,
                    ).join(", ")}`,
                  );
                return;
              }
            } else {
              res
                .status(400)
                .send(
                  `You must provide a mood value to get a story from a list`,
                );
            }
          } else {
            res
              .status(401)
              .send(
                `User ${req.user.username} is not authorized to retrieve object with id ${req.params.id}`,
              );
          }
        } else {
          res.status(404).send(`Object with id ${req.params.id} not found`);
        }
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async retrieveAllObjects(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(403)
          .send("Forbidden: request must come from an authenticated user");
      } else {
        const collection = this.db.collection(
          req.query.test === "true" ? LIST_TEST_COLLECTION : LIST_COLLECTION,
        );
        const objects = await collection
          .find({ username: req.user.username })
          .toArray();
        res.status(200).send(objects);
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async updateObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(
        req.query.test === "true" ? LIST_TEST_COLLECTION : LIST_COLLECTION,
      );
      if (req.params.id.length !== 24) {
        res
          .status(400)
          .send("The id provided must be a string with 24 characters");
      } else if (!req.user) {
        res
          .status(403)
          .send("Forbidden: request must come from an authenticated user");
      } else {
        const object = await collection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (object) {
          if (object.username === req.user.username) {
            const { _id, ...updateData } = req.body;
            updateData.modifiedDate = new Date();
            const itemsAreSame =
              object.items.length === updateData.items.length &&
              object.items.every(
                (item: { name: string }, index: number) =>
                  item.name === updateData.items[index].name,
              );

            if (!itemsAreSame) {
              updateData.suggestions = await this.generateItemSuggestions(
                updateData as MasterList,
              );
            }
            const updatedObject = await collection.findOneAndReplace(
              {
                _id: new ObjectId(req.params.id),
              },
              updateData,
              { returnDocument: "after" },
            );
            res.status(200).send(updatedObject);
          } else {
            res
              .status(401)
              .send(
                `User ${req.user.username} is not authorized to retrieve object with id ${req.params.id}`,
              );
          }
        } else {
          res.status(404).send(`Object with id ${req.params.id} not found`);
        }
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async deleteObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(
        req.query.test === "true" ? LIST_TEST_COLLECTION : LIST_COLLECTION,
      );
      if (req.params.id.length !== 24) {
        res
          .status(400)
          .send("The id provided must be a string with 24 characters");
      } else if (!req.user) {
        res
          .status(403)
          .send("Forbidden: request must come from an authenticated user");
      } else {
        const object = await collection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (object) {
          if (object.username === req.user.username) {
            await collection.deleteOne({
              _id: new ObjectId(req.params.id),
            });
            res.status(200).send(`Deleted object with id: ${req.params.id}`);
          } else {
            res
              .status(401)
              .send(
                `User ${req.user.username} is not authorized to delete object with id ${req.params.id}`,
              );
          }
        } else {
          res.status(404).send(`Object with id ${req.params.id} not found`);
        }
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }

  private async generateStoryFromList(
    object: MasterList,
    mood: StoryMood,
  ): Promise<string> {
    console.log(`Your task is to generate a ${mood} story`);
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates stories from a list of words.",
        },
        {
          role: "user",
          content: `Your task is to generate a ${mood} story that is at most ${
            object.items.length
          } sentences long and incorporates the following words: ${JSON.stringify(
            object.items.map((item) => item.name),
          )}.`,
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages,
      });

      if (
        response.choices &&
        response.choices[0] &&
        response.choices[0].message &&
        response.choices[0].message.content
      ) {
        return response.choices[0].message.content.trim();
      } else {
        return "No story could be generated.";
      }
    } catch (error) {
      console.error("Error generating story:", error);
      return "Error generating story";
    }
  }

  private async generateItemSuggestions(object: MasterList): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "You are a helpful assistant that provides suggestions for list items.",
        },
        {
          role: "user",
          content: `Your task is to generate three suggestions of NEW items that could be added to a list called ${
            object.name
          } that already contains the following items: ${JSON.stringify(
            object.items.map((item) => item.name),
          )}. If the list does not already contain any items, you will need to base your suggestions off the name of the list. The response should ALWAYS be in this format: Here are some suggested items for your list: {item1}, {item2}, {item3}. Example response for a list with name "food" that already contains "cheese" and "carrots": Here are some suggested items for your list: bread, cereal, and milk`,
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 50,
      });

      if (
        response.choices &&
        response.choices[0] &&
        response.choices[0].message &&
        response.choices[0].message.content
      ) {
        return response.choices[0].message.content.trim();
      } else {
        return "No suggestions could be generated.";
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      return "Error generating suggestions";
    }
  }
}

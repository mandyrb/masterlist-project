import { Request, Response } from "express";
import { MongoClient, Db, ObjectId } from "mongodb";
import { COLLECTION_NAME } from "../constants";
import { isMasterListCreateRequest, MasterList } from "../types/listTypes";

export class RequestHandler {
  private db: Db;

  constructor(client: MongoClient, dbName: string) {
    this.db = client.db(dbName);
  }

  public async insertObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(COLLECTION_NAME);
      if (!isMasterListCreateRequest(req.body)) {
        res
          .status(400)
          .send(`Bad request: body must contain fields 'name' and 'items'`);
      } else {
        const list: MasterList = {
          ...req.body,
          createdDate: new Date(),
          modifiedDate: new Date(),
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
      const collection = this.db.collection(COLLECTION_NAME);
      if (req.params.id.length !== 24) {
        res
          .status(400)
          .send("The id provided must be a string with 24 characters");
      } else {
        const object = await collection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (object) {
          res.status(200).send(object);
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
      const collection = this.db.collection(COLLECTION_NAME);
      const objects = await collection.find({}).toArray();
      res.status(200).send(objects);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async updateObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(COLLECTION_NAME);
      if (req.params.id.length !== 24) {
        res
          .status(400)
          .send("The id provided must be a string with 24 characters");
      } else {
        const { _id, ...updateData } = req.body;
        updateData.modifiedDate = new Date();
        const object = await collection.findOneAndReplace(
          {
            _id: new ObjectId(req.params.id),
          },
          updateData,
          { returnDocument: "after" },
        );
        if (object) {
          res.status(200).send(object);
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
      const collection = this.db.collection(COLLECTION_NAME);
      if (req.params.id.length !== 24) {
        res
          .status(400)
          .send("The id provided must be a string with 24 characters");
      } else {
        const object = await collection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        if (object) {
          res.status(200).send(`Deleted object with id: ${req.params.id}`);
        } else {
          res.status(404).send(`Object with id ${req.params.id} not found`);
        }
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
}

// src/handlers/requestHandler.ts
import { Request, Response } from "express";
import { MongoClient, Db, ObjectId } from "mongodb";
import { COLLECTION_NAME } from "../constants";
import { MasterList } from "../types/listTypes";

export class RequestHandler {
  private db: Db;

  constructor(client: MongoClient, dbName: string) {
    this.db = client.db(dbName);
  }

  public async insertObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(COLLECTION_NAME);
      const list: MasterList = {
        ...req.body,
        createdDate: new Date(),
        modifiedDate: new Date(),
      };
      const result = await collection.insertOne(list);
      res.status(201).send(result);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async retrieveObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(COLLECTION_NAME);
      const object = await collection.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (object) {
        res.status(200).send(object);
      } else {
        res.status(404).send(`Object with id ${req.params.id} not found`);
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
    } catch (error) {
      res.status(500).send(error);
    }
  }

  public async deleteObject(req: Request, res: Response): Promise<void> {
    try {
      const collection = this.db.collection(COLLECTION_NAME);
      const object = await collection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      if (object) {
        res.status(200).send(`Deleted object with id: ${req.params.id}`);
      } else {
        res.status(404).send(`Object with id ${req.params.id} not found`);
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
}

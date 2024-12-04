import { MongoClient } from "mongodb";
import { RequestHandler } from "../../handlers/requestHandler";
import { Request, Response } from "express";
import { COLLECTION_NAME, MONGO_URL, TEST_DB_NAME } from "../../constants";
import { MasterListCreateRequest } from "../../types/listTypes";

describe("RequestHandler Integration Tests", () => {
  let client: MongoClient;
  let requestHandler: RequestHandler;

  beforeAll(async () => {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    requestHandler = new RequestHandler(client, TEST_DB_NAME);
    await client.db(TEST_DB_NAME).collection(COLLECTION_NAME).deleteMany({});
  });

  afterAll(async () => {
    await client.db(TEST_DB_NAME).collection(COLLECTION_NAME).deleteMany({});
    await client.close();
  });

  it("should insert, read, update, and delete an object from the database", async () => {
    // Insert
    const bodyOne: MasterListCreateRequest = {
      name: "Test List 1",
      items: ["item1", "item2"],
    };
    const reqInsertOne = { body: bodyOne } as Request;
    const resInsertOne = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn() as jest.Mock,
    } as unknown as Response;
    await requestHandler.insertObject(reqInsertOne, resInsertOne);

    expect(resInsertOne.status).toHaveBeenCalledWith(201);
    expect(resInsertOne.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: bodyOne.name,
        items: bodyOne.items,
      }),
    );
    const insertedIdOne = (resInsertOne.send as jest.Mock).mock.calls[0][0]._id;

    // Read
    const reqRead = {
      params: { id: insertedIdOne.toString() },
    } as unknown as Request;
    const resRead = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.retrieveObject(reqRead, resRead);

    expect(resRead.status).toHaveBeenCalledWith(200);
    expect(resRead.send).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: insertedIdOne,
        name: bodyOne.name,
        items: bodyOne.items,
      }),
    );

    // Insert a second item so we can read all
    const bodyTwo: MasterListCreateRequest = {
      name: "Test List 2",
      items: ["item1", "item2"],
    };
    const reqInsertTwo = { body: bodyTwo } as Request;
    const resInsertTwo = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn() as jest.Mock,
    } as unknown as Response;
    await requestHandler.insertObject(reqInsertTwo, resInsertTwo);
    const insertedIdTwo = (resInsertTwo.send as jest.Mock).mock.calls[0][0]._id;

    // Read All
    const reqReadAll = {
      params: {},
    } as unknown as Request;
    const resReadAll = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.retrieveAllObjects(reqReadAll, resReadAll);

    expect(resReadAll.status).toHaveBeenCalledWith(200);
    expect(resReadAll.send).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          _id: insertedIdOne,
          name: bodyOne.name,
          items: bodyOne.items,
        }),
        expect.objectContaining({
          _id: insertedIdTwo,
          name: bodyTwo.name,
          items: bodyTwo.items,
        }),
      ]),
    );

    // Update
    const reqUpdate = {
      params: { id: insertedIdOne.toString() },
      body: { name: "Updated List", items: ["item3", "item4"] },
    } as unknown as Request;
    const resUpdate = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.updateObject(reqUpdate, resUpdate);

    expect(resUpdate.status).toHaveBeenCalledWith(200);
    expect(resUpdate.send).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: insertedIdOne,
        name: reqUpdate.body.name,
        items: reqUpdate.body.items,
      }),
    );

    // Verify Update
    const reqVerifyUpdate = {
      params: { id: insertedIdOne.toString() },
    } as unknown as Request;
    const resVerifyUpdate = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.retrieveObject(reqVerifyUpdate, resVerifyUpdate);

    expect(resVerifyUpdate.status).toHaveBeenCalledWith(200);
    expect(resVerifyUpdate.send).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: insertedIdOne,
        name: reqUpdate.body.name,
        items: reqUpdate.body.items,
      }),
    );

    // Delete
    const reqDelete = {
      params: { id: insertedIdOne.toString() },
    } as unknown as Request;
    const resDelete = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.deleteObject(reqDelete, resDelete);

    expect(resDelete.status).toHaveBeenCalledWith(200);
    expect(resDelete.send).toHaveBeenCalledWith(
      `Deleted object with id: ${insertedIdOne}`,
    );

    // Verify Deletion
    const resVerifyDelete = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.retrieveObject(reqRead, resVerifyDelete);

    expect(resVerifyDelete.status).toHaveBeenCalledWith(404);
    expect(resVerifyDelete.send).toHaveBeenCalledWith(
      `Object with id ${insertedIdOne} not found`,
    );
  });
});

import { MongoClient } from "mongodb";
import { RequestHandler } from "../../requestHandler";
import { Request, Response } from "express";
import {
  LIST_TEST_COLLECTION,
  MONGO_URL,
  DB_NAME,
  USER_TEST_COLLECTION,
} from "../../constants";
import { MasterListCreateRequest, StoryMood } from "../../types";

describe("RequestHandler Integration Tests", () => {
  let client: MongoClient;
  let requestHandler: RequestHandler;

  beforeAll(async () => {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    requestHandler = new RequestHandler(client, DB_NAME);
    await client.db(DB_NAME).collection(LIST_TEST_COLLECTION).deleteMany({});
    await client.db(DB_NAME).collection(USER_TEST_COLLECTION).deleteMany({});
  });

  afterAll(async () => {
    await client.db(DB_NAME).collection(LIST_TEST_COLLECTION).deleteMany({});
    await client.db(DB_NAME).collection(USER_TEST_COLLECTION).deleteMany({});
    await client.close();
  });

  it("should create a new user, allow them to login, and handle CRUD operations", async () => {
    const username = "testuser";
    const password = "testpassword";

    // Create user
    const reqCreateUser = {
      body: { username, password },
      query: { test: "true" },
    } as unknown as Request;
    const resCreateUser = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.createUser(reqCreateUser, resCreateUser);

    expect(resCreateUser.status).toHaveBeenCalledWith(201);
    expect(resCreateUser.send).toHaveBeenCalledWith(
      expect.objectContaining({ username }),
    );

    // Login user
    const reqLogin = {
      body: { username, password },
      query: { test: "true" },
    } as unknown as Request;
    const resLogin = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.loginUser(reqLogin, resLogin);

    expect(resLogin.status).toHaveBeenCalledWith(200);
    expect(resLogin.send).toHaveBeenCalledWith(
      expect.objectContaining({ token: expect.any(String) }),
    );

    // Read user
    const reqGetUser = {
      params: { username },
      query: { test: "true" },
    } as unknown as Request;
    const resGetUser = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.getUser(reqGetUser, resGetUser);

    expect(resGetUser.status).toHaveBeenCalledWith(200);
    expect(resGetUser.send).toHaveBeenCalledWith(
      expect.objectContaining({ username }),
    );

    // Update user
    const newPassword = "newpassword";
    const reqUpdateUser = {
      params: { username },
      body: { password: newPassword },
      query: { test: "true" },
    } as unknown as Request;
    const resUpdateUser = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.updateUser(reqUpdateUser, resUpdateUser);

    expect(resUpdateUser.status).toHaveBeenCalledWith(200);
    expect(resUpdateUser.send).toHaveBeenCalledWith(
      `User with username ${username} updated`,
    );

    // Delete user
    const reqDeleteUser = {
      params: { username },
      query: { test: "true" },
    } as unknown as Request;
    const resDeleteUser = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.deleteUser(reqDeleteUser, resDeleteUser);

    expect(resDeleteUser.status).toHaveBeenCalledWith(200);
    expect(resDeleteUser.send).toHaveBeenCalledWith(
      `User with username ${username} deleted`,
    );
  });

  it("should insert, read, update, and delete an object from the database", async () => {
    // Insert
    const bodyOne: MasterListCreateRequest = {
      name: "Test List 1",
      items: [
        { name: "item1", favorite: false },
        { name: "item2", favorite: true },
      ],
    };
    const reqInsertOne = {
      body: bodyOne,
      query: { test: "true" },
      user: { username: "testuser" },
    } as unknown as Request;
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
    const insertedObjectOne = (resInsertOne.send as jest.Mock).mock.calls[0][0];
    const insertedIdOne = insertedObjectOne._id;

    // Read
    const reqRead = {
      params: { id: insertedIdOne.toString() },
      query: { test: "true" },
      user: { username: "testuser" },
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

    // Try to get a story without providing a mood
    const reqStoryNoMood = {
      params: { id: insertedIdOne.toString() },
      query: { test: "true" },
      user: { username: "testuser" },
    } as unknown as Request;
    const resStoryNoMood = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.retrieveStory(reqStoryNoMood, resStoryNoMood);
    const responseNoMood = (resStoryNoMood.send as jest.Mock).mock.calls[0][0];
    expect(resStoryNoMood.status).toHaveBeenCalledWith(400);
    expect(responseNoMood).toEqual(
      "You must provide a mood value to get a story from a list",
    );

    // Try to get a story with an invalid mood
    const reqStoryInvalid = {
      params: { id: insertedIdOne.toString() },
      query: { test: "true", mood: "sci-fi" },
      user: { username: "testuser" },
    } as unknown as Request;
    const resStoryInvalid = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.retrieveStory(reqStoryInvalid, resStoryInvalid);
    const responseInvalidMood = (resStoryInvalid.send as jest.Mock).mock
      .calls[0][0];
    expect(resStoryInvalid.status).toHaveBeenCalledWith(400);
    expect(responseInvalidMood).toContain(
      "Invalid mood value provided. Valid options include:",
    );

    // Get a story using a valid mood
    const reqStory = {
      params: { id: insertedIdOne.toString() },
      query: { test: "true", mood: StoryMood.SAD },
      user: { username: "testuser" },
    } as unknown as Request;
    const resStory = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;
    await requestHandler.retrieveStory(reqStory, resStory);
    expect(resStory.status).toHaveBeenCalledWith(200);
    const story = (resStory.send as jest.Mock).mock.calls[0][0];
    expect(typeof story).toBe("string");

    // Insert a second item so we can read all
    const bodyTwo: MasterListCreateRequest = {
      name: "Test List 2",
      items: [
        { name: "item1", favorite: false },
        { name: "item2", favorite: true },
      ],
    };
    const reqInsertTwo = {
      body: bodyTwo,
      query: { test: "true" },
      user: { username: "testuser" },
    } as unknown as Request;
    const resInsertTwo = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn() as jest.Mock,
    } as unknown as Response;
    await requestHandler.insertObject(reqInsertTwo, resInsertTwo);
    const insertedIdTwo = (resInsertTwo.send as jest.Mock).mock.calls[0][0]._id;

    // Read All
    const reqReadAll = {
      params: {},
      query: { test: "true" },
      user: { username: "testuser" },
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
      body: {
        ...insertedObjectOne,
        name: "Updated List",
        items: [
          { name: "item3", favorite: false },
          { name: "item4", favorite: true },
        ],
      },
      query: { test: "true" },
      user: { username: "testuser" },
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
    // Suggestions should also be updated
    const updatedObject = (resUpdate.send as jest.Mock).mock.calls[0][0];
    expect(updatedObject.suggestions).not.toEqual(
      insertedObjectOne.suggestions,
    );

    // Delete
    const reqDelete = {
      params: { id: insertedIdOne.toString() },
      query: { test: "true" },
      user: { username: "testuser" },
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

import request from "supertest";
import { API_URL } from "../../constants";
import { StoryMood } from "../../types";
const testUser = { username: "testuser", password: "testpassword" };

describe("Auth API Endpoints", () => {
  beforeAll(async () => {
    // Ensure the test user exists
    await request(API_URL)
      .post("/users")
      .query({ test: "true" })
      .send(testUser);
  });

  it("should not create a user with an existing username", async () => {
    const response = await request(API_URL)
      .post("/users")
      .query({ test: "true" })
      .send(testUser);

    expect(response.status).toBe(409);
    expect(response.text).toContain("Username already exists");
  });

  it("should login a user successfully", async () => {
    const response = await request(API_URL)
      .post("/login")
      .query({ test: "true" })
      .send(testUser);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ token: expect.any(String) }),
    );
  });

  it("should not login with incorrect password", async () => {
    const response = await request(API_URL)
      .post("/login")
      .query({ test: "true" })
      .send({ ...testUser, password: "wrongpassword" });

    expect(response.status).toBe(401);
    expect(response.text).toContain("Invalid username or password");
  });

  it("should not login with non-existent username", async () => {
    const response = await request(API_URL)
      .post("/login")
      .query({ test: "true" })
      .send({ username: "nonexistentuser", password: "testpassword" });

    expect(response.status).toBe(401);
    expect(response.text).toContain("Invalid username or password");
  });
});

describe("List API Endpoints", () => {
  let token: string;

  beforeAll(async () => {
    // Ensure the test user exists
    await request(API_URL)
      .post("/users")
      .query({ test: "true" })
      .send(testUser);

    // Login to get the token
    const loginResponse = await request(API_URL)
      .post("/login")
      .query({ test: "true" })
      .send({ username: "testuser", password: "testpassword" });

    token = loginResponse.body.token;
  });

  it("should handle CRUD operations", async () => {
    // Create a new object
    const postResponse = await request(API_URL)
      .post("/list")
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" })
      .send({
        name: "Test List",
        items: [
          { name: "item1", favorite: false },
          { name: "item2", favorite: true },
        ],
      });
    expect(postResponse.status).toBe(201);
    const id = postResponse.body._id;
    expect(id).toBeDefined();

    // Bad create request
    const badCreateResponse = await request(API_URL)
      .post("/list")
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" })
      .send({
        items: [
          { name: "item1", favorite: false },
          { name: "item2", favorite: true },
        ],
      }); // Missing 'name' field
    expect(badCreateResponse.status).toBe(400);
    expect(badCreateResponse.text).toContain(
      "Bad request: body must contain fields 'name' and 'items'",
    );

    // Retrieve all objects
    const getAllResponse = await request(API_URL)
      .get("/list")
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(getAllResponse.status).toBe(200);
    expect(Array.isArray(getAllResponse.body)).toBe(true);

    // Retrieve the specific object
    const getResponse = await request(API_URL)
      .get(`/list/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe("Test List");

    // Bad read request - nonexistent id
    const nonExistentId = "000000000000000000000000";
    const badReadResponseOne = await request(API_URL)
      .get(`/list/${nonExistentId}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(badReadResponseOne.status).toBe(404);
    expect(badReadResponseOne.text).toBe(
      `Object with id ${nonExistentId} not found`,
    );

    // Bad read request - incorrect id length
    const shortId = "0000000";
    const badReadResponseTwo = await request(API_URL)
      .get(`/list/${shortId}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(badReadResponseTwo.status).toBe(400);
    expect(badReadResponseTwo.text).toBe(
      `The id provided must be a string with 24 characters`,
    );

    // Update the object
    const patchResponse = await request(API_URL)
      .patch(`/list/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...getResponse.body,
        name: "Updated List",
        items: [{ name: "item3", favorite: false }],
      })
      .query({ test: "true" });
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.name).toBe("Updated List");

    // Delete the object
    const deleteResponse = await request(API_URL)
      .delete(`/list/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.text).toBe(`Deleted object with id: ${id}`);
  });
});

describe("Story API Endpoints", () => {
  let token: string;

  beforeAll(async () => {
    // Ensure the test user exists
    await request(API_URL)
      .post("/users")
      .query({ test: "true" })
      .send(testUser);

    // Login to get the token
    const loginResponse = await request(API_URL)
      .post("/login")
      .query({ test: "true" })
      .send({ username: "testuser", password: "testpassword" });

    token = loginResponse.body.token;
  });

  it("should retrieve a story for a list", async () => {
    // Create a new object
    const postResponse = await request(API_URL)
      .post("/list")
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" })
      .send({
        name: "Test Story List",
        items: [
          { name: "item1", favorite: false },
          { name: "item2", favorite: true },
        ],
      });
    expect(postResponse.status).toBe(201);
    const id = postResponse.body._id;

    // Get a story from the list
    const getResponse = await request(API_URL)
      .get(`/story/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true", mood: StoryMood.HAPPY });
    expect(getResponse.status).toBe(200);
    expect(typeof getResponse.text).toBe("string");

    // List not found
    const getResponseNotFound = await request(API_URL)
      .get(`/story/000000000000000000000000`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true", mood: StoryMood.HAPPY });
    expect(getResponseNotFound.status).toBe(404);

    // Bad request, mood not provided
    const getResponseNoMood = await request(API_URL)
      .get(`/story/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(getResponseNoMood.status).toBe(400);

    // Bad request, invalid mood
    const getResponseInvalidMood = await request(API_URL)
      .get(`/story/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true", mood: "sci-fi" });
    expect(getResponseInvalidMood.status).toBe(400);
  });
});

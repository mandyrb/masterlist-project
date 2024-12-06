import request from "supertest";
import { API_URL } from "../../constants";
const testUser = { username: "testuser", password: "testpassword" };

describe("User API Endpoints", () => {
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
      .post("/")
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" })
      .send({ name: "Test List", items: ["item1", "item2"] });
    expect(postResponse.status).toBe(201);
    const id = postResponse.body._id;
    expect(id).toBeDefined();

    // Bad create request
    const badCreateResponse = await request(API_URL)
      .post("/")
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" })
      .send({ items: ["item1", "item2"] }); // Missing 'name' field
    expect(badCreateResponse.status).toBe(400);
    expect(badCreateResponse.text).toContain(
      "Bad request: body must contain fields 'name' and 'items'",
    );

    // Retrieve all objects
    const getAllResponse = await request(API_URL)
      .get("/")
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(getAllResponse.status).toBe(200);
    expect(Array.isArray(getAllResponse.body)).toBe(true);

    // Retrieve the specific object
    const getResponse = await request(API_URL)
      .get(`/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe("Test List");

    // Bad read request - nonexistent id
    const nonExistentId = "000000000000000000000000";
    const badReadResponseOne = await request(API_URL)
      .get(`/${nonExistentId}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(badReadResponseOne.status).toBe(404);
    expect(badReadResponseOne.text).toBe(
      `Object with id ${nonExistentId} not found`,
    );

    // Bad read request - incorrect id length
    const shortId = "0000000";
    const badReadResponseTwo = await request(API_URL)
      .get(`/${shortId}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(badReadResponseTwo.status).toBe(400);
    expect(badReadResponseTwo.text).toBe(
      `The id provided must be a string with 24 characters`,
    );

    // Update the object
    const patchResponse = await request(API_URL)
      .patch(`/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...getResponse.body, name: "Updated List", items: ["item3"] })
      .query({ test: "true" });
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.name).toBe("Updated List");

    // Delete the object
    const deleteResponse = await request(API_URL)
      .delete(`/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .query({ test: "true" });
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.text).toBe(`Deleted object with id: ${id}`);
  });
});

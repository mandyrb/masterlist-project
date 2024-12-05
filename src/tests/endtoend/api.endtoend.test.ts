import request from "supertest";
import { API_URL } from "../../constants";

describe("API Endpoints", () => {
  it("should handle CRUD operations", async () => {
    // Create a new object
    const postResponse = await request(API_URL)
      .post("/")
      .query({ test: "true" })
      .send({ name: "Test List", items: ["item1", "item2"] });
    expect(postResponse.status).toBe(201);
    const id = postResponse.body._id;
    expect(id).toBeDefined();

    // Bad create request
    const badCreateResponse = await request(API_URL)
      .post("/")
      .query({ test: "true" })
      .send({ items: ["item1", "item2"] }); // Missing 'name' field
    expect(badCreateResponse.status).toBe(400);
    expect(badCreateResponse.text).toContain(
      "Bad request: body must contain fields 'name' and 'items'",
    );

    // Retrieve all objects
    const getAllResponse = await request(API_URL)
      .get("/")
      .query({ test: "true" });
    expect(getAllResponse.status).toBe(200);
    expect(Array.isArray(getAllResponse.body)).toBe(true);

    // Retrieve the specific object
    const getResponse = await request(API_URL)
      .get(`/${id}`)
      .query({ test: "true" });
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe("Test List");

    // Bad read request - nonexistent id
    const nonExistentId = "000000000000000000000000";
    const badReadResponseOne = await request(API_URL)
      .get(`/${nonExistentId}`)
      .query({ test: "true" });
    expect(badReadResponseOne.status).toBe(404);
    expect(badReadResponseOne.text).toBe(
      `Object with id ${nonExistentId} not found`,
    );

    // Bad read request - incorrect id length
    const shortId = "0000000";
    const badReadResponseTwo = await request(API_URL)
      .get(`/${shortId}`)
      .query({ test: "true" });
    expect(badReadResponseTwo.status).toBe(400);
    expect(badReadResponseTwo.text).toBe(
      `The id provided must be a string with 24 characters`,
    );

    // Update the object
    const patchResponse = await request(API_URL)
      .patch(`/${id}`)
      .send({ name: "Updated List", items: ["item3"] })
      .query({ test: "true" });
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.name).toBe("Updated List");

    // Delete the object
    const deleteResponse = await request(API_URL)
      .delete(`/${id}`)
      .query({ test: "true" });
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.text).toBe(`Deleted object with id: ${id}`);
  });
});

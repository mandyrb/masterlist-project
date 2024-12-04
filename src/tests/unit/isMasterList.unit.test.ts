import { isMasterListCreateRequest } from "../../types/listTypes";

describe("isMasterListCreateRequest", () => {
  it("should return true for a valid MasterListCreateRequest object", () => {
    const validRequest = {
      name: "Sample List",
      items: ["item1", "item2"],
    };
    expect(isMasterListCreateRequest(validRequest)).toBe(true);
  });

  it("should return false for an object missing the name field", () => {
    const invalidRequest = {
      items: ["item1", "item2"],
    };
    expect(isMasterListCreateRequest(invalidRequest)).toBe(false);
  });

  it("should return false for an object missing the items field", () => {
    const invalidRequest = {
      name: "Sample List",
    };
    expect(isMasterListCreateRequest(invalidRequest)).toBe(false);
  });

  it("should return false for an object with items not being an array", () => {
    const invalidRequest = {
      name: "Sample List",
      items: "not-an-array",
    };
    expect(isMasterListCreateRequest(invalidRequest)).toBe(false);
  });

  it("should return false for an object with name not being a string", () => {
    const invalidRequest = {
      name: 123,
      items: ["item1", "item2"],
    };
    expect(isMasterListCreateRequest(invalidRequest)).toBe(false);
  });
});

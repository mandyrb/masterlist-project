export const isMasterListCreateRequest = (obj: any): boolean => {
  return (
    obj.hasOwnProperty("name") &&
    obj.hasOwnProperty("items") &&
    typeof obj.name === "string" &&
    Array.isArray(obj.items)
  );
};

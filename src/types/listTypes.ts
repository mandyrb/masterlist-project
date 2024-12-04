import { ObjectId } from "mongodb";

export interface MasterList {
  _id?: ObjectId;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  items: string[];
}

export interface MasterListCreateRequest {
  name: string;
  items: string[];
}

export const isMasterListCreateRequest = (obj: any): boolean => {
  return (
    obj.hasOwnProperty("name") &&
    obj.hasOwnProperty("items") &&
    typeof obj.name === "string" &&
    Array.isArray(obj.items)
  );
};

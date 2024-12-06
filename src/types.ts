import { ObjectId } from "mongodb";

export interface MasterList {
  _id?: ObjectId;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  items: string[];
  username: string;
}

export interface MasterListCreateRequest {
  name: string;
  items: string[];
}

export interface User {
  _id?: ObjectId;
  username: string;
  passwordHash: string;
}

export interface UserAuth {
  username: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      username: string;
    };
  }
}

import { ObjectId } from "mongodb";

export interface MasterList {
  _id?: ObjectId;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  items: MasterListItem[];
  username: string;
  suggestions?: string;
  pinned: boolean;
}

export interface MasterListItem {
  name: string;
  favorite: boolean;
}

export interface MasterListCreateRequest {
  name: string;
  items: MasterListItem[];
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

export enum StoryMood {
  HAPPY = "happy",
  SAD = "sad",
  SCARY = "scary",
}

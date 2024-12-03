import { ObjectId } from "mongodb";

export interface MasterList {
  _id?: ObjectId;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  items: string[];
}

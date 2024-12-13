export enum StoryMood {
  HAPPY = "happy",
  SAD = "sad",
  SCARY = "scary",
}

export interface UserList {
  _id: string;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  items: MasterListItem[];
  suggestions: string;
  pinned: boolean;
}

export interface MasterListItem {
  name: string;
  favorite: boolean;
}

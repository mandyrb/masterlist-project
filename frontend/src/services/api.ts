import { MasterListItem, StoryMood } from "../services/types";

const API_URL = "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const fetchLists = async () => {
  const response = await fetch(`${API_URL}/list/`, {
    headers: getAuthHeaders(),
  });
  await handleApiResponse(response);
  return response.json();
};

export const createList = async (list: { name: string; items: string[] }) => {
  const response = await fetch(`${API_URL}/list/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(list),
  });
  await handleApiResponse(response);
  return response.json();
};

export const updateList = async (
  id: string,
  list: { name: string; items: MasterListItem[] },
) => {
  const response = await fetch(`${API_URL}/list/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(list),
  });
  await handleApiResponse(response);
  return response.json();
};

export const getStoryForList = async (id: string, mood: StoryMood) => {
  const response = await fetch(`${API_URL}/story/${id}?mood=${mood}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  await handleApiResponse(response);
  return response.text();
};

export const deleteList = async (id: string) => {
  const response = await fetch(`${API_URL}/list/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await handleApiResponse(response);
};

export const registerUser = async (user: {
  username: string;
  password: string;
}) => {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const responseBody = await response.text();
  if (!response.ok) {
    throw { message: responseBody, status: response.status };
  }
  return JSON.parse(responseBody);
};

export const loginUser = async (user: {
  username: string;
  password: string;
}) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const responseBody = await response.text();
  if (!response.ok) {
    throw { message: responseBody, status: response.status };
  }
  return JSON.parse(responseBody);
};

export const handleApiResponse = async (response: Response) => {
  if (response.status === 403) {
    const responseBody = await response.text();
    if (responseBody.includes("Invalid token")) {
      throw {
        message: "Invalid token",
        status: response.status,
      };
    }
  }
};

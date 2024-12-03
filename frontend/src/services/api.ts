const API_URL = "http://localhost:3000";

export const fetchLists = async () => {
  const response = await fetch(`${API_URL}/`);
  return response.json();
};

export const createList = async (list: { name: string; items: string[] }) => {
  const response = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(list),
  });
  return response.json();
};

export const updateList = async (
  id: string,
  list: { name: string; items: string[] },
) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(list),
  });
  return response.json();
};

export const deleteList = async (id: string) => {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
};

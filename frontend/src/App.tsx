import React, { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import CreateListForm from "./components/CreateListForm";
import ListView from "./components/ListView";
import { fetchLists, createList, updateList, deleteList } from "./services/api";

interface List {
  _id: string;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  items: string[];
}

const App: React.FC = () => {
  const [lists, setLists] = useState<List[]>([]);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const data = await fetchLists();
        setLists(data);
      } catch (error) {
        console.error("Failed to fetch lists:", error);
      }
    };
    loadLists();
  }, []);

  const handleCreateList = async (name: string) => {
    try {
      await createList({ name, items: [] });
      const data = await fetchLists();
      setLists(data);
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  const handleUpdateList = async (id: string, updatedItems: string[]) => {
    try {
      const list = lists.find((l) => l._id === id);
      if (list) {
        await updateList(id, { name: list.name, items: updatedItems });
        const data = await fetchLists();
        setLists(data);
      }
    } catch (error) {
      console.error("Failed to update list:", error);
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList(id);
      const data = await fetchLists();
      setLists(data);
    } catch (error) {
      console.error("Failed to delete list:", error);
    }
  };

  return (
    <Container
      sx={{ backgroundColor: "lightblue", minHeight: "100vh", padding: 2 }}
    >
      <Typography variant="h1" align="center" gutterBottom>
        List Manager
      </Typography>
      <CreateListForm onCreate={handleCreateList} />
      <ListView
        lists={lists}
        onDelete={handleDeleteList}
        onEdit={handleUpdateList}
      />
    </Container>
  );
};

export default App;

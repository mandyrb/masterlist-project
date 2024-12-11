import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";
import CreateListForm from "./components/CreateListForm";
import ListView from "./components/ListView";
import Auth from "./components/Auth";
import { fetchLists, createList, updateList, deleteList } from "./services/api";

export interface UserList {
  _id: string;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  items: string[];
  suggestions: string;
}

const App: React.FC = () => {
  const [lists, setLists] = useState<UserList[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const loadLists = async () => {
        try {
          const data = await fetchLists();
          setLists(data);
        } catch (error) {
          console.error("Failed to fetch lists:", error);
        }
      };
      loadLists();
    }
  }, [isAuthenticated]);

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
        await updateList(id, { ...list, items: updatedItems });
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setLists([]);
  };

  return (
    <Router>
      <Container
        sx={{
          backgroundColor: "lightblue",
          minHeight: "100vh",
          padding: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 2,
            position: "relative",
          }}
        >
          <Typography
            variant="h1"
            align="center"
            gutterBottom
            sx={{ flexGrow: 1 }}
          >
            List Manager
          </Typography>
          {isAuthenticated && (
            <Button
              onClick={handleLogout}
              variant="contained"
              color="primary"
              sx={{ position: "absolute", right: 0 }}
            >
              Logout
            </Button>
          )}
        </Box>
        <Typography variant="h4" align="center" gutterBottom>
          Welcome to List Manager where you can create custom lists!
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <>
                    <CreateListForm onCreate={handleCreateList} />
                    <ListView
                      lists={lists}
                      onDelete={handleDeleteList}
                      onEdit={handleUpdateList}
                    />
                  </>
                ) : (
                  <Auth onAuthSuccess={() => setIsAuthenticated(true)} />
                )
              }
            />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
};

export default App;

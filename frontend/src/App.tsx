import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";
import CreateListForm from "./components/CreateListForm";
import ListView from "./components/ListView";
import Auth from "./components/Auth";
import { fetchLists, createList, updateList, deleteList } from "./services/api";
import { UserList } from "./services/types";

const App: React.FC = () => {
  const [lists, setLists] = useState<UserList[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setLists([]);
  };

  const handleExpiredToken = useCallback(() => {
    handleLogout();
    setAuthError("Your session has expired; please login again");
  }, [handleLogout]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadLists = async () => {
        try {
          const data = await fetchLists();
          setLists(data);
        } catch (error: any) {
          if (error.message && error.message === "Invalid token") {
            handleExpiredToken();
          } else console.error("Failed to fetch lists:", error);
        }
      };
      loadLists();
    }
  }, [isAuthenticated, handleExpiredToken]);

  const handleCreateList = async (name: string) => {
    try {
      await createList({ name, items: [] });
      const data = await fetchLists();
      setLists(data);
    } catch (error: any) {
      if (error.message && error.message === "Invalid token") {
        handleExpiredToken();
      } else console.error("Failed to create list:", error);
    }
  };

  const handleUpdateList = async (updatedList: UserList) => {
    try {
      await updateList(updatedList._id, updatedList);
      const data = await fetchLists();
      setLists(data);
    } catch (error: any) {
      if (error.message && error.message === "Invalid token") {
        handleExpiredToken();
      } else console.error("Failed to update list:", error);
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList(id);
      const data = await fetchLists();
      setLists(data);
    } catch (error: any) {
      if (error.message && error.message === "Invalid token") {
        handleExpiredToken();
      } else console.error("Failed to delete lists:", error);
    }
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
          Welcome to List Manager where you can create custom lists, and
          generate fun stories about those lists!
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
                      handleLogout={handleLogout}
                      setAuthError={setAuthError}
                    />
                  </>
                ) : (
                  <Auth
                    onAuthSuccess={() => setIsAuthenticated(true)}
                    errorMessage={authError}
                  />
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

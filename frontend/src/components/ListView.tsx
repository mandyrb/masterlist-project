import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { MasterListItem, UserList } from "../App";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

interface ListViewProps {
  lists: UserList[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updatedItems: MasterListItem[]) => void;
}

const ListView: React.FC<ListViewProps> = ({ lists, onDelete, onEdit }) => {
  const [newItem, setNewItem] = useState<{ [key: string]: string }>({
    name: "",
  });

  const handleAddItem = (listId: string) => {
    if (newItem[listId]) {
      const list = lists.find((l) => l._id === listId);
      if (list) {
        const newMasterListItem: MasterListItem = {
          name: newItem[listId],
          favorite: false,
        };
        onEdit(listId, [...list.items, newMasterListItem]);
        setNewItem({ ...newItem, [listId]: "" });
      }
    }
  };

  const handleDeleteItem = (listId: string, itemIndex: number) => {
    const list = lists.find((l) => l._id === listId);
    if (list) {
      const updatedItems = list.items.filter((_, index) => index !== itemIndex);
      onEdit(listId, updatedItems);
    }
  };

  const toggleFavorite = (listId: string, itemIndex: number) => {
    const list = lists.find((l) => l._id === listId);
    if (list) {
      const updatedItems = list.items.map((item, index) =>
        index === itemIndex ? { ...item, favorite: !item.favorite } : item,
      );
      onEdit(listId, updatedItems);
    }
  };

  return (
    <Grid container spacing={2}>
      {lists.length > 0 ? (
        lists.map((list) => (
          <Grid item xs={12} sm={6} md={4} key={list._id}>
            <Card sx={{ marginBottom: 2 }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {list.name}
                </Typography>
                <List>
                  {list.items.map((item, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <>
                          <IconButton
                            edge="end"
                            onClick={() => toggleFavorite(list._id, index)}
                          >
                            {item.favorite ? (
                              <FavoriteIcon />
                            ) : (
                              <FavoriteBorderIcon />
                            )}
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteItem(list._id, index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      }
                    >
                      <ListItemText primary={item.name} />
                    </ListItem>
                  ))}
                </List>
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddItem(list._id);
                  }}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <TextField
                    variant="outlined"
                    label="Add new item"
                    value={newItem[list._id] || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, [list._id]: e.target.value })
                    }
                    sx={{ flexGrow: 1 }}
                  />
                  <Button type="submit" variant="contained" color="primary">
                    Add Item
                  </Button>
                </Box>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{
                    color: "rgba(0, 0, 0, 0.6)",
                    marginTop: 1,
                    marginBottom: 3,
                  }}
                >
                  {list.suggestions}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => onDelete(list._id)}
                  sx={{ marginTop: 2 }}
                >
                  Delete List
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Typography variant="body1"></Typography>
      )}
    </Grid>
  );
};

export default ListView;

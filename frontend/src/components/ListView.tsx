import React, { useEffect, useState } from "react";
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { MasterListItem, UserList } from "../App";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import { getStoryForList } from "../services/api";
import { StoryMood } from "../services/types";

interface ListViewProps {
  lists: UserList[];
  onDelete: (id: string) => void;
  onEdit: (updatedList: UserList) => void;
}

const ListView: React.FC<ListViewProps> = ({ lists, onDelete, onEdit }) => {
  const [newItem, setNewItem] = useState<{ [key: string]: string }>({
    name: "",
  });
  const [stories, setStories] = useState<{ [key: string]: string }>(() => {
    const savedStories = localStorage.getItem("stories");
    return savedStories ? JSON.parse(savedStories) : {};
  });
  const [moods, setMoods] = useState<{ [key: string]: StoryMood }>({});

  useEffect(() => {
    localStorage.setItem("stories", JSON.stringify(stories));
  }, [stories]);

  const handleAddItem = (listId: string) => {
    const list = lists.find((l) => l._id === listId);
    if (list && newItem[listId]) {
      const newMasterListItem: MasterListItem = {
        name: newItem[listId],
        favorite: false,
      };
      const updatedList = {
        ...list,
        items: [...list.items, newMasterListItem],
      };
      onEdit(updatedList);
      setNewItem({ ...newItem, [listId]: "" });
    }
  };

  const handleDeleteItem = (listId: string, itemIndex: number) => {
    const list = lists.find((l) => l._id === listId);
    if (list) {
      const updatedItems = list.items.filter((_, index) => index !== itemIndex);
      const updatedList = { ...list, items: updatedItems };
      onEdit(updatedList);
    }
  };

  const toggleFavorite = (listId: string, itemIndex: number) => {
    const list = lists.find((l) => l._id === listId);
    if (list) {
      const updatedItems = list.items.map((item, index) =>
        index === itemIndex ? { ...item, favorite: !item.favorite } : item,
      );
      const updatedList = { ...list, items: updatedItems };
      onEdit(updatedList);
    }
  };

  const togglePinned = (listId: string) => {
    const list = lists.find((l) => l._id === listId);
    if (list) {
      const updatedList = { ...list, pinned: !list.pinned };
      onEdit(updatedList);
    }
  };

  const fetchStory = async (listId: string) => {
    try {
      const mood = moods[listId] || StoryMood.HAPPY;
      const story = await getStoryForList(listId, mood);
      setStories((prevStories) => ({ ...prevStories, [listId]: story }));
    } catch (error) {
      console.error("Failed to fetch story:", error);
    }
  };

  const sortedLists = [...lists].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0),
  );

  return (
    <Grid container spacing={2}>
      {sortedLists.length > 0 ? (
        sortedLists.map((list) => (
          <Grid item xs={12} key={list._id}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Card sx={{ flexGrow: 1 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h5" component="div">
                      {list.name}
                    </Typography>
                    <IconButton onClick={() => togglePinned(list._id)}>
                      {list.pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                    </IconButton>
                  </Box>
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
              <Card sx={{ width: "30%" }}>
                <CardContent>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Mood</FormLabel>
                    <RadioGroup
                      row
                      value={moods[list._id] || StoryMood.HAPPY}
                      onChange={(e) =>
                        setMoods({
                          ...moods,
                          [list._id]: e.target.value as StoryMood,
                        })
                      }
                    >
                      <FormControlLabel
                        value={StoryMood.HAPPY}
                        control={<Radio />}
                        label="Happy"
                      />
                      <FormControlLabel
                        value={StoryMood.SAD}
                        control={<Radio />}
                        label="Sad"
                      />
                      <FormControlLabel
                        value={StoryMood.SCARY}
                        control={<Radio />}
                        label="Scary"
                      />
                    </RadioGroup>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => fetchStory(list._id)}
                    sx={{ marginTop: 2 }}
                  >
                    Get Story
                  </Button>
                  <Typography variant="body2" sx={{ marginTop: 2 }}>
                    {stories[list._id] || "No story available"}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        ))
      ) : (
        <Typography variant="body1">No lists available</Typography>
      )}
    </Grid>
  );
};

export default ListView;

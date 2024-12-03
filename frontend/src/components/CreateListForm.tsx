import { Box, Button, TextField } from "@mui/material";
import React, { useState } from "react";

interface CreateListFormProps {
  onCreate: (name: string) => void;
}

const CreateListForm: React.FC<CreateListFormProps> = ({ onCreate }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        marginBottom: 3,
      }}
    >
      <TextField
        variant="outlined"
        label="List Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        sx={{
          backgroundColor: "white",
        }}
      />
      <Button type="submit" variant="contained" color="primary">
        Create List
      </Button>
    </Box>
  );
};

export default CreateListForm;

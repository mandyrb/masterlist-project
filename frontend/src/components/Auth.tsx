import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../services/api";

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "register") {
        await registerUser({ username, password });
        setMode("login");
        setPassword("");
      } else {
        const { token } = await loginUser({ username, password });
        localStorage.setItem("token", token);
        onAuthSuccess();
        navigate("/");
      }
    } catch (error: any) {
      if (error.message) {
        setError(error.message || "An error occurred");
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleAuth}
      sx={{ maxWidth: 300, mx: "auto", mt: 9 }}
    >
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, newMode) => setMode(newMode)}
        fullWidth
        sx={{ mb: 2, justifyContent: "space-between" }}
      >
        <ToggleButton
          value="login"
          sx={{
            mr: 4,
            backgroundColor: mode === "login" ? "primary.main" : "lightblue",
            color: mode === "login" ? "white" : "black",
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              color: "white",
            },
            "&:hover": {
              backgroundColor: mode === "login" ? "primary.main" : "lightblue",
              color: mode === "login" ? "white" : "black",
            },
          }}
        >
          Login
        </ToggleButton>
        <ToggleButton
          value="register"
          sx={{
            backgroundColor: mode === "register" ? "primary.main" : "lightblue",
            color: mode === "register" ? "white" : "black",
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              color: "white",
            },
            "&:hover": {
              backgroundColor:
                mode === "register" ? "primary.main" : "lightblue",
              color: mode === "register" ? "white" : "black",
            },
          }}
        >
          Register
        </ToggleButton>
      </ToggleButtonGroup>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        required
        margin="normal"
        sx={{ backgroundColor: "white" }}
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        margin="normal"
        sx={{ backgroundColor: "white" }}
      />
      <Button type="submit" variant="contained" color="primary" fullWidth>
        {mode === "register" ? "Register" : "Login"}
      </Button>
    </Box>
  );
};

export default Auth;

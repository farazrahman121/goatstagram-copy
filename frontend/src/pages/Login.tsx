import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext.tsx";
import { CurrentUserContextType } from "../context/AuthContext.tsx";

import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function Login() {

  const navigate = useNavigate(); 
  const { login } = useAuth() as CurrentUserContextType;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>("");
  
  const handleLogin = async () => {
    try {
      console.log("attempting log in")
      const resp = await login({ username: username, password: password }); // Add 'await' keyword here
      if (resp === "Success") {
        navigate(`/home`);
      } else {
        setError("Login failed.");
      }
    } catch (error) {
      setError(`Login failed.`);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === "username") {
      setUsername(value);
    } else if (name === "password") {
      setPassword(value);
    }
  };

  return (
    <>
       <Box
        sx={{
          my: 8,
          mx: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Log in
        </Typography>
        <Box sx={{ mt: 1 }}>
          <TextField 
            margin="normal"
            required
            fullWidth
            id="outlined-basic" 
            label="Username" 
            variant="outlined" 
            name="username"
            onChange={handleInputChange}
          />
          <TextField 
            margin="normal"
            required
            fullWidth
            id="outlined-basic" 
            label="Password" 
            variant="outlined" 
            name="password"
            type="password"
            onChange={handleInputChange}
          />
          <Collapse in={error !== ""}>
            <Alert
              severity="error"
              variant="outlined"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError("");
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {error}
            </Alert>
          </Collapse>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 2 }}
            onClick={handleLogin}
          >
            Log in
          </Button>
          <Grid container>
            <Grid item>
              <Link href="/signup" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  )
}

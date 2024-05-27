import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

interface CurrentUserContextType {
  isLoggedIn: boolean;
  login: (data: { username: any; password: any; }) => Promise<string>; // Update the return type to Promise<string>
  logout: () => void;
}

type ContextProviderProps = {
  children?: React.ReactNode;
}
export type { CurrentUserContextType };

const AuthContext = createContext<CurrentUserContextType | null>(null);

export const useAuth = () => {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }: ContextProviderProps) => {
  // TODO: FIX THIS LINE TO FIT WITH FARAZ IMPLIMENTATION 
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('JWToken'));
  const navigate = useNavigate();


  const login = async (data: { username: any; password: any; }) => {
    try {
      const response = await axios.post("http://localhost:8080/login", {
        username: data.username,
        password: data.password
      });

      if(response.status === 200){
        console.log("enter success condition")
        localStorage.setItem('username', response.data.username); // Store the username in local storage
        localStorage.setItem('JWToken', response.data.token); // Store the JWT in local storage
        localStorage.setItem('userID', response.data.user_id); 
        setIsLoggedIn(true);

        //navigate(`${data.username}/home`);
        return "Success";
      } else {
        setIsLoggedIn(false);
        return "Failure";
      }
    } catch (error: any) {
      setIsLoggedIn(false);
      return `Login failed: ${error.response.data.error}`;
    }
  };

  const logout = async () => {
    // perform logout actions, remove stuff from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('JWToken');
    localStorage.removeItem('userID');
    setIsLoggedIn(false);
    navigate("/");
    console.log("logged out");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
);
}

export default AuthContext;
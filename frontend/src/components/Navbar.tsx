import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ChatIcon from '@mui/icons-material/Chat';
import Search from '@mui/icons-material/Search';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import HouseIcon from '@mui/icons-material/Cottage';
import Newspaper from '@mui/icons-material/Newspaper';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import { ListItemButton } from '@mui/material';

import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';

import { useAuth } from '../context/AuthContext';
import { CurrentUserContextType } from "../context/AuthContext.tsx";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { isLoggedIn, logout } = useAuth() as CurrentUserContextType;
    const username = localStorage.getItem('username');

    const toggleDrawer = (newOpen: boolean) => () => {
      setOpen(newOpen);
    };

    const menuItems = [
        { text: 'Home', path: '/home', icon: <HouseIcon />},
        { text: 'My Profile', path: '/', icon: <AccountCircle /> },
        { text: 'Friends', path: '/friends', icon: <PeopleAltIcon />},
        { text: 'Chat', path: '/chat', icon: <ChatIcon/>},
        { text: 'Search', path: '/search', icon: <Search/>},
        { text: 'Explore', path: '/explore', icon: <TravelExploreIcon/>},
        { text: 'News', path: '/news', icon: <Newspaper/>},
    ];

    const handleNavigate = (path: string) => {
        if (path === '/') {
            navigate(`/${username}/profile`);
        } else if (path === '/friends') {
            navigate(`/${username}/friends`);
        } else if (path === '/chat') {
            navigate(`/chat`);
        } else if (path === '/search') {
            navigate(`/search`);
        } else if (path === '/explore') {
            navigate(`/explore`);
        } else if (path === '/home') {
            navigate(`/home`);
        } else if (path === '/news') {
            navigate(`/${username}/news`);

        }
    }

    const DrawerList = (
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
          <List>
            <ListItem>
              <Typography sx={{fontWeight:'bold'}}>Menu</Typography>
            </ListItem>
            <Divider />
            {menuItems.map(({ text, path, icon }) => (
              <ListItem key={text} disablePadding onClick={() => handleNavigate(path)}>
                <ListItemButton>
                  <ListItemIcon>
                    {icon}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                color: 'white'
            }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={toggleDrawer(true)}
                >
                    <MenuIcon />
                </IconButton>
                <button>
                    <Typography variant="h6" component="div" sx={{ 
                        flexGrow: 1, 
                        letterSpacing: '.1rem',
                        mr: 2,
                        display: { xs: 'none', md: 'flex' },
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: 'inherit',
                    }}
                        onClick={() => navigate('/home')}>
                        GOATSTAGRAM - {localStorage.getItem('username')}
                    </Typography>
                </button>
                {isLoggedIn ? (
                    <Button color="inherit" onClick={logout} sx={{ml:'auto'}}>Logout</Button>
                ) : (
                    <Button color="inherit" onClick={() => navigate("/")} sx={{ml:'auto'}}>Login</Button>
                )}
                <Drawer open={open} onClose={toggleDrawer(false)}>
                    {DrawerList}
                </Drawer>
                </Toolbar>
            </AppBar>
        </Box>
    )
}
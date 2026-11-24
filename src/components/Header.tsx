import { useState } from 'react'
import { NavLink } from 'react-router'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '../auth/useAuth.ts'
import { navItems } from '../navItems.ts'

const APP_TITLE = 'User List'

/** App bar with the title. The nav (inline links on sm and up, menu button and Drawer below) is for logged-in users only. */
function Header() {
  const { isAuthenticated } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = () => setDrawerOpen(false)

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          {isAuthenticated && (
            <IconButton
              color="inherit"
              edge="start"
              aria-label="open navigation menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component={NavLink}
            to="/"
            sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
          >
            {APP_TITLE}
          </Typography>

          {isAuthenticated && (
            <Box component="nav" sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
              {navItems.map(({ label, path }) => (
                <Button
                  key={path}
                  component={NavLink}
                  to={path}
                  end
                  color="inherit"
                  sx={{ '&.active': { bgcolor: 'rgba(255, 255, 255, 0.16)' } }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        // Also closed when logged out, so the menu never shows without the nav.
        open={drawerOpen && isAuthenticated}
        onClose={closeDrawer}
        sx={{ display: { sm: 'none' } }}
      >
        <Box component="nav" sx={{ width: 240 }}>
          <Typography variant="h6" sx={{ px: 2, py: 2 }}>
            {APP_TITLE}
          </Typography>
          <List>
            {navItems.map(({ label, path }) => (
              <ListItem key={path} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={path}
                  end
                  onClick={closeDrawer}
                  sx={{ '&.active': { bgcolor: 'action.selected' } }}
                >
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  )
}

export default Header

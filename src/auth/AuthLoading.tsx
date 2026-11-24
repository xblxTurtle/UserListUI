import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

/** Shown by the route guards while the session check on mount is in flight. */
function AuthLoading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress aria-label="Checking your session" />
    </Box>
  )
}

export default AuthLoading

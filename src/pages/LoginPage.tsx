import { useState, type SubmitEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    // Not wired to the API yet.
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Log in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" fullWidth>
              Log in
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}

export default LoginPage

import { useRef, useState, type SubmitEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { LoginError } from '../auth/authApi.ts'
import { useAuth } from '../auth/useAuth.ts'

const ERROR_MESSAGES: Record<LoginError, string> = {
  'invalid-credentials': 'Incorrect username or password.',
  // Also what the user sees when the server is down: the dev proxy answers with an HTTP error.
  server: "The server isn't responding. Try again in a moment.",
  network: "Can't reach the server. Check your connection and try again.",
}

/**
 * The login form. It only calls `login()` and shows what went wrong: on success the auth state
 * changes and `GuestOnly`, which wraps this page, sends the user on.
 */
function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  // Set on submit for each empty field; a field's error clears as soon as the user edits it.
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<LoginError | null>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    // The disabled button already blocks a second submit; this covers anything that slips past it.
    if (submitting) return

    const usernameEmpty = username.trim() === ''
    const passwordEmpty = password === ''
    setUsernameError(usernameEmpty ? 'Enter your username' : '')
    setPasswordError(passwordEmpty ? 'Enter your password' : '')
    if (usernameEmpty || passwordEmpty) {
      const firstEmpty = usernameEmpty ? usernameRef : passwordRef
      firstEmpty.current?.focus()
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const result = await login(username, password)
      if (result.ok) return
      setError(result.error)
      if (result.error === 'invalid-credentials') setPassword('')
      // The button was disabled, so focus fell to <body>: bring it back into the form.
      passwordRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Log in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            {error && <Alert severity="error">{ERROR_MESSAGES[error]}</Alert>}
            <TextField
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setUsernameError('')
              }}
              error={usernameError !== ''}
              helperText={usernameError || undefined}
              inputRef={usernameRef}
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
              onChange={(event) => {
                setPassword(event.target.value)
                setPasswordError('')
              }}
              error={passwordError !== ''}
              helperText={passwordError || undefined}
              inputRef={passwordRef}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              loading={submitting}
              loadingPosition="start"
            >
              {submitting ? 'Logging in…' : 'Log in'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}

export default LoginPage

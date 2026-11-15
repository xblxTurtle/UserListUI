import { Link } from 'react-router'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

function NotFoundPage() {
  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Page not found
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        The page you are looking for does not exist.
      </Typography>
      <Button variant="contained" component={Link} to="/">
        Back to Home
      </Button>
    </>
  )
}

export default NotFoundPage

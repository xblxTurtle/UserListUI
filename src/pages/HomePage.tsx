
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'
import { GET_USERS } from '../users/queries.ts'
import { useQuery } from '@apollo/client/react'

function HomePage() {
  const { data, error } = useQuery(GET_USERS)

  // The list is not rendered yet. Log it to confirm the server connection works.
  useEffect(() => {
    if (error) console.error('Failed to load users', error)
    else if (data) console.log('Users', data.users)
  }, [data, error])

  


  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome
      </Typography>
      <Typography variant="body1">
        This is the User List app. Use the navigation above to browse users or learn more
        about the project.
      </Typography>
    </>
  )
}

export default HomePage

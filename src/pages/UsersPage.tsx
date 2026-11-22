import { useQuery } from '@apollo/client/react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useRef, useState } from 'react'
import { GET_USERS } from '../users/queries.ts'

function UsersPage() {
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [page, setPage] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const usersSectionRef = useRef<HTMLElement>(null)
  const { data, error, loading, refetch } = useQuery(GET_USERS)

  const count = data?.users.length ?? 0
  // `page` can point past the end when the list shrinks, so clamp it to the last page.
  const currentPage = Math.min(page, Math.max(0, Math.ceil(count / rowsPerPage) - 1))
  const start = currentPage * rowsPerPage
  const usersOnPage = data?.users.slice(start, start + rowsPerPage)

  async function retry(button: HTMLButtonElement) {
    setRetrying(true)
    try {
      await refetch()
      // The button is about to unmount, so hand its focus to the results.
      if (document.activeElement === button) usersSectionRef.current?.focus()
    } catch {
      // Nothing to do: the failure is also returned as `error`, which shows the alert.
    } finally {
      setRetrying(false)
    }
  }

  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Users
      </Typography>

      <Box component="section" aria-label="Users" ref={usersSectionRef} tabIndex={-1}>
        {/* Not an early return: a failed refetch has both an error and the previous rows.
            `retrying` is needed because Apollo clears `error` as soon as a refetch starts. */}
        {(error || retrying) && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              // Not `loading` or `disabled`: a disabled button drops keyboard focus.
              <Button
                color="inherit"
                size="small"
                aria-disabled={retrying}
                onClick={(event) => retry(event.currentTarget)}
              >
                {retrying ? 'Retrying…' : 'Retry'}
              </Button>
            }
          >
            Could not load users.
          </Alert>
        )}

        {/* `count` is also 0 while loading and after an error, so check `data` too. */}
        {data && count === 0 && (
          <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            No users found.
          </Typography>
        )}

        {/* `loading` is also true during refetches, so check `data` to keep the rows visible then. */}
        {loading && !data && !retrying && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress aria-label="Loading users" />
          </Box>
        )}

        {count > 0 && (
          <Paper>
            {/* Focusable, so keyboard users can scroll it sideways on narrow screens. */}
            <TableContainer tabIndex={0} role="region" aria-label="Users table, scrollable">
              <Table sx={{ minWidth: 650 }} aria-label="Users table">
                <TableHead>
                  <TableRow>
                    <TableCell>First name</TableCell>
                    <TableCell>Last name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersOnPage?.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {user.firstName}
                      </TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Outside TableContainer, so it stays on screen when the table scrolls sideways. */}
            <TablePagination
              component="div"
              // The toolbar is too wide for phones with the label. Screen readers still announce it.
              sx={{ '& .MuiTablePagination-selectLabel': { display: { xs: 'none', sm: 'block' } } }}
              count={count}
              page={currentPage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10]}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
            />
          </Paper>
        )}
      </Box>
    </>
  )
}

export default UsersPage

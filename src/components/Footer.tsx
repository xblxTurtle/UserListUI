import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

const CURRENT_YEAR = new Date().getFullYear()

function Footer() {
  return (
    <Box
      component="footer"
      sx={{ py: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.100' }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          © {CURRENT_YEAR} User List
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer

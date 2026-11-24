import { Outlet } from 'react-router'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Footer from '../components/Footer.tsx'
import Header from '../components/Header.tsx'

/**
 * Shared page shell: header, routed page content, footer.
 * A full-height flex column where `main` grows, so the footer sits at the bottom on short pages.
 */
function MainLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Header />
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
      <Footer />
    </Box>
  )
}

export default MainLayout

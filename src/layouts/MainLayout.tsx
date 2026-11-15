import { Outlet } from 'react-router'
import Container from '@mui/material/Container'
import Footer from '../components/Footer.tsx'
import Header from '../components/Header.tsx'

/** Shared page shell: header, routed page content, footer. */
function MainLayout() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
      <Footer />
    </>
  )
}

export default MainLayout

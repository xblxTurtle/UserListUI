import { Outlet, Route, Routes } from 'react-router'
import GuestOnly from './auth/GuestOnly.tsx'
import Protected from './auth/Protected.tsx'
import MainLayout from './layouts/MainLayout.tsx'
import AboutPage from './pages/AboutPage.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import UsersPage from './pages/UsersPage.tsx'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          path="login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        {/* Every other page, the 404 included, needs a logged-in user. */}
        <Route
          element={
            <Protected>
              <Outlet />
            </Protected>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

export type NavItem = {
  label: string
  path: string
}

/** Header navigation links. Add an entry here and a matching route in App.tsx to add a page. */
export const navItems: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Users', path: '/users' },
  { label: 'About', path: '/about' },
]

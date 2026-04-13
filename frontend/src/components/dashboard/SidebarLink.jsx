import { NavLink } from 'react-router-dom';

const SidebarLink = ({ to, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-lg px-4 py-3 text-sm font-semibold transition duration-200 relative ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
        }`
      }
    >
      {children}
    </NavLink>
  );
};

export default SidebarLink;
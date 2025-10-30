import { NavLink } from 'react-router-dom';

function SidebarComponent({ handleLogout }) {
  // Use NavLink to get automatic active state
  return (
    <div className="sidebar">
      {/* Menu */}
      <nav>
        <ul>
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/user-management" className={({ isActive }) => (isActive ? 'active' : '')}>
              User Management
            </NavLink>
          </li>
          <li>
            <NavLink to="/business" className={({ isActive }) => (isActive ? 'active' : '')}>
              Business Management
            </NavLink>
          </li>
          <li>
            <NavLink to="/pending-approvals" className={({ isActive }) => (isActive ? 'active' : '')}>
              Pending Approvals
            </NavLink>
          </li>
          <li>
            <NavLink to="/promotions" className={({ isActive }) => (isActive ? 'active' : '')}>
              Promotions
            </NavLink>
          </li>
          <li>
            <NavLink to="/events" className={({ isActive }) => (isActive ? 'active' : '')}>
              Events
            </NavLink>
          </li>
          <li>
            <NavLink to="/subscriptions" className={({ isActive }) => (isActive ? 'active' : '')}>
              Subscriptions & Payments
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom Section: Separator and Settings */}
      <div>
        <hr className="sidebar-separator" />
        <ul>
          <li>
            <a href="#" onClick={handleLogout}>
              Logout
            </a>
          </li>
          {/* <li>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
              Settings
            </NavLink>
          </li> */}
        </ul>
      </div>
    </div>
  );
}

export default SidebarComponent;

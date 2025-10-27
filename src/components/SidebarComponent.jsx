import { Link } from 'react-router-dom';

function SidebarComponent({ handleLogout }) {
  return (
    <div className="sidebar">
      {/* Menu */}
      <nav>
        <ul>
          <li>
            <Link to="/" className="active">
              Home
            </Link>
          </li>
          <li>
            <Link to="/user-management">
              User Management
            </Link>
          </li>
          <li>
            <Link to="/business">
              Business Management
            </Link>
          </li>
          <li>
            <Link to="/pending-approvals">
              Pending Approvals
            </Link>
          </li>
      
          
          <li>
            <Link to="/promotions">
              Promotions
            </Link>
          </li>
          
          <li>
            <Link to="/subscriptions">
              Subscriptions &  Payments
            </Link>
          </li>
        </ul>
      </nav>

      {/* Bottom Section: Separator and Settings */}
      <div>
        <hr className="sidebar-separator" />
        <ul>
          <li>
            <Link to="#" onClick={handleLogout}>
              Logout
            </Link>
          </li>
          <li>
            <Link to="/settings">
              Settings
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default SidebarComponent;
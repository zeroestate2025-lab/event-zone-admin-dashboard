import { useState, useEffect } from 'react';
import '../styles/UserManagement.css';
import { getAllUsers } from '../services/apiService'; // Import the API function

function UserManagement({ isSidebarOpen }) {
  // State to manage the users and dropdown visibility for each row
  const [users, setUsers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllUsers();
        // Assuming the API returns an array of user objects.
        // Each user object should have fields like: id, name, phone, email, location, status
        // We will use id, name, and phone (or phoneNumber)
        // Example: if API returns 'userName' instead of 'name', use user.userName
        console.log("Fetched users:", data);
        setUsers(data || []); // Ensure data is an array
      } catch (err) {
        console.error("Failed to fetch users:", err.message || err);
        setError(err.message || "Failed to load users.");
        setUsers([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const [error, setError] = useState(null);

  return (
    <div className={`user-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header Section */}
      <div className="user-management-header">
        <div className="header-left">
          <span className="back-arrow">←</span>
          <h1>User Management</h1>
        </div>
        <div className="header-right">
          {/* <div className="search-bar">
            <input type="text" placeholder="Search" />
            <span className="search-icon">🔍</span>
          </div> */}
          <div className="total-users">
            <span>Total Users: {loading ? '...' : users.length}</span>
          </div>
        </div>
      </div>

      {loading && <p className="loading-message">Loading users...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {/* Table Section */}
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Business ID</th>
              <th>Name</th>
              <th>Phone Number</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && users.length > 0 ? (
              users.map((user, index) => (
                // It's better to use a unique ID from the user data if available, e.g., user.id
                <tr key={user.id || index}>
                  <td>{user.id || 'N/A'}</td>
                  <td>{user.name || 'N/A'}</td>
                  <td>{user.phone || user.phoneNumber || 'N/A'}</td> {/* Check API field name */}
                </tr>
              ))
            ) : !loading && !error && users.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>No users found.</td>
                </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;
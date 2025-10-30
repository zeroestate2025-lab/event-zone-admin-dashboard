import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import '../styles/UserManagement.css';
import { getAllBusinessPartners } from '../services/apiService';

function UserManagement({ isSidebarOpen }) {
  const [users, setUsers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllBusinessPartners();
        const transformedData = data.map(partner => ({
          id: partner.id,
          name: partner.proprietorName || partner.businessName || 'N/A',
          phone: partner.phoneNumber || 'N/A',
          email: partner.email || 'N/A',
          location: partner.location ? `${partner.location}, ${partner.district}` : partner.district || 'N/A',
          status: partner.isApproved ? 'Active' : 'Suspend'
        }));
        setUsers(transformedData);
      } catch (err) {
        console.error("Failed to fetch business partners:", err.message || err);
        setError(err.message || "Failed to load users.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleDropdown = (index) => {
    setIsDropdownOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleStatusChange = (index, newStatus) => {
    const updatedUsers = [...users];
    updatedUsers[index].status = newStatus;
    setUsers(updatedUsers);
    setIsDropdownOpen(prev => ({
      ...prev,
      [index]: false
    }));
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`user-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <PageHeader title="User management" showBreadcrumb={true} />

      {/* Header Actions */}
      <div className="user-management-actions">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="total-users">
          Total Users : {loading ? '...' : users.length}
        </div>
      </div>

      {loading && <p className="loading-message">Loading users...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {/* Table Section */}
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Location</th>
              <th>
                Status 
                <span className="sort-arrow">⌄</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <tr key={user.id || index}>
                  <td>{user.name}</td>
                  <td>{user.phone}</td>
                  <td>{user.email}</td>
                  <td>{user.location}</td>
                  <td>
                    <div className="custom-dropdown">
                      <div 
                        className={`dropdown-header ${user.status === 'Suspend' ? 'suspend' : user.status === 'Block' ? 'block' : 'active'}`}
                        onClick={() => toggleDropdown(index)}
                      >
                        <span>{user.status}</span>
                        <span className="dropdown-arrow">⌄</span>
                      </div>
                      {isDropdownOpen[index] && (
                        <ul className="dropdown-options">
                          <li 
                            className="dropdown-option"
                            onClick={() => handleStatusChange(index, 'Active')}
                          >
                            Active
                          </li>
                          <li 
                            className="dropdown-option"
                            onClick={() => handleStatusChange(index, 'Suspend')}
                          >
                            Suspend
                          </li>
                          <li 
                            className="dropdown-option"
                            onClick={() => handleStatusChange(index, 'Block')}
                          >
                            Block
                          </li>
                        </ul>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : !loading && !error && filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;

// import { useState, useEffect } from 'react';
// import '../styles/UserManagement.css';
// import { getAllUsers } from '../services/apiService'; // Import the API function

// function UserManagement({ isSidebarOpen }) {
//   // State to manage the users and dropdown visibility for each row
//   const [users, setUsers] = useState([]);
//   const [isDropdownOpen, setIsDropdownOpen] = useState({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const data = await getAllUsers();
//         // Assuming the API returns an array of user objects.
//         // Each user object should have fields like: id, name, phone, email, location, status
//         // We will use id, name, and phone (or phoneNumber)
//         // Example: if API returns 'userName' instead of 'name', use user.userName
//         console.log("Fetched users:", data);
//         setUsers(data || []); // Ensure data is an array
//       } catch (err) {
//         console.error("Failed to fetch users:", err.message || err);
//         setError(err.message || "Failed to load users.");
//         setUsers([]); // Set to empty array on error
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   const [error, setError] = useState(null);

//   return (
//     <div className={`user-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//       {/* Header Section */}
//       <div className="user-management-header">
//         <div className="header-left">
//           <span className="back-arrow">←</span>
//           <h1>User Management</h1>
//         </div>
//         <div className="header-right">
//           {/* <div className="search-bar">
//             <input type="text" placeholder="Search" />
//             <span className="search-icon">🔍</span>
//           </div> */}
//           <div className="total-users">
//             <span>Total Users: {loading ? '...' : users.length}</span>
//           </div>
//         </div>
//       </div>

//       {loading && <p className="loading-message">Loading users...</p>}
//       {error && <p className="error-message">Error: {error}</p>}

//       {/* Table Section */}
//       <div className="user-table-container">
//         <table className="user-table">
//           <thead>
//             <tr>
//               <th>Business ID</th>
//               <th>Name</th>
//               <th>Phone Number</th>
//             </tr>
//           </thead>
//           <tbody>
//             {!loading && !error && users.length > 0 ? (
//               users.map((user, index) => (
//                 // It's better to use a unique ID from the user data if available, e.g., user.id
//                 <tr key={user.id || index}>
//                   <td>{user.id || 'N/A'}</td>
//                   <td>{user.name || 'N/A'}</td>
//                   <td>{user.phone || user.phoneNumber || 'N/A'}</td> {/* Check API field name */}
//                 </tr>
//               ))
//             ) : !loading && !error && users.length === 0 ? (
//                 <tr>
//                   <td colSpan="3" style={{ textAlign: 'center' }}>No users found.</td>
//                 </tr>
//             ) : null}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default UserManagement;
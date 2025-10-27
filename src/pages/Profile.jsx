import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import '../styles/Profile.css';

function Profile({ isSidebarOpen }) {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Admin', // This should also ideally be fetched
    loginPhoneNumber: 'storedphonenumber', // Initialize as empty, will be fetched
    address: '123 Main St, City', // This should also ideally be fetched
  });
  const [editedData, setEditedData] = useState({ ...userData });
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // Fetch user data when the component mounts
    // For now, we'll just get the login phone number from localStorage
    // In a real app, you might fetch all user profile data from an API
    const storedLoginPhoneNumber = localStorage.getItem('adminLoginPhoneNumber');
    if (storedLoginPhoneNumber) {
      setUserData(prevData => ({
        ...prevData,
        loginPhoneNumber: storedLoginPhoneNumber,
      }));
      setEditedData(prevData => ({ // Also update editedData if userData changes
        ...prevData,
        loginPhoneNumber: storedLoginPhoneNumber,
      }));
    } else {
      // Handle case where login phone number is not found (e.g., redirect to login)
      console.warn("Login phone number not found in localStorage.");
    }
  }, []);


  const handleEdit = () => setIsEditing(true);
  const handleSave = () => {
    setUserData({ ...editedData });
    setIsEditing(false);
  };
  const handleChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };
  const handleChangePassword = () => {
    // In a real application, this would navigate to a change password screen
    // or open a modal for changing the password.
    alert("Redirecting to change password page (not implemented).");
    // navigate('/change-password'); // Example navigation
  };

  return (
    <div className={`profile ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="profile-header">
        <div className="header-left">
          <span className="back-arrow" onClick={() => navigate(-1)} style={{cursor: 'pointer'}}>←</span>
          <h1>Profile</h1>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-info">
            <h2>User Information</h2>
            <div className="info-row">
              <span>Name:</span>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editedData.name}
                  onChange={handleChange}
                />
              ) : (
                <span>{userData.name}</span>
              )}
            </div>
            {/* <div className="info-row">
              <span>Login Phone:</span>
              <span>{userData.loginPhoneNumber}</span>
            </div> */}
            
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Profile;   
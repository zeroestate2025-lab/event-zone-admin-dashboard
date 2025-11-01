import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import SidebarComponent from './components/SidebarComponent';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { getAuthToken, clearAuthToken } from './services/apiService';
import UserManagement from './pages/UserManagement';
import BusinessManagement from './pages/BusinessManagement';
import Approvals from './pages/Approvals';
import ViewDetails from './components/ViewDetails';
import ViewBill from './components/ViewBill';
import Events from './pages/Events';
import Promotions from './pages/Promotions';
import PendingApprovals from './pages/PendingApprovals';
import Subscriptions from './pages/Subscriptions';
import Profile from './pages/Profile';
import BusinessViewProfile from './pages/BusinessViewProfile';
import { FaUserCircle } from 'react-icons/fa';
import './App.css';
import SponsoredProfile from './pages/SponsoredProfile';

const MainAppLayout = ({
  isSidebarOpen,
  toggleSidebar,
  handleLogout,
  isProfileModalOpen,
  toggleProfileModal,
}) => {
  return (
    <div className="app-container">
      {/* Top Header - Row 1 (Always Fixed at Top) */}
      <header className="app-top-header">
        <div className="header-left">
          <h1 className="company-name">Evnzon</h1>
        </div>
        <div className="header-right">
          <div className="header-profile-container" onClick={toggleProfileModal}>
            <div className="header-profile-icon">
              <FaUserCircle size={40} color="#FC9256" />
            </div>
          </div>
        </div>
      </header>

      {/* Second Row - Navigation Bar with Sidebar and Content Header */}
      <div className="app-content-wrapper">
        {/* Sidebar Container */}
        <div className={`sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
          {/* Hamburger Button */}
          <button className="hamburger-toggle" onClick={toggleSidebar}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          
          {/* Sidebar Component */}
          <SidebarComponent handleLogout={handleLogout} />
        </div>

        {/* Main Content Area */}
        <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Routes>
            <Route path="/" element={<Dashboard isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />} />
            <Route path="/user-management" element={<UserManagement isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />} />
            <Route path="/business" element={<BusinessManagement isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />} />
            <Route path="/content" element={<Approvals isSidebarOpen={isSidebarOpen} />} />
            <Route path="/view-details" element={<ViewDetails />} />
            <Route path="/view-bill" element={<ViewBill />} />
            <Route path="/events" element={<Events isSidebarOpen={isSidebarOpen} />} />
            <Route path="/promotions" element={<Promotions isSidebarOpen={isSidebarOpen} />} />
            <Route path="/sponsored-profiles" element={<SponsoredProfile isSidebarOpen={isSidebarOpen} />} />
            <Route path="/pending-approvals" element={<PendingApprovals isSidebarOpen={isSidebarOpen} />} />
            <Route path="/subscriptions" element={<Subscriptions isSidebarOpen={isSidebarOpen} />} />
            <Route path="/profile" element={<Profile isSidebarOpen={isSidebarOpen} />} />
            <Route path="/business-profile/:businessId" element={<BusinessViewProfile isSidebarOpen={isSidebarOpen} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="profile-modal-overlay" onClick={toggleProfileModal}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Admin Profile</h2>
              <button className="profile-modal-close" onClick={toggleProfileModal}>×</button>
            </div>
            <div className="profile-modal-body">
              <div className="profile-modal-image-container">
                <img 
                  src="https://via.placeholder.com/120?text=Admin" 
                  alt="Admin Profile" 
                  className="profile-modal-image"
                />
              </div>
              <div className="profile-modal-details">
                <div className="profile-detail-item">
                  <label>Name:</label>
                  <span>Admin</span>
                </div>
                <div className="profile-detail-item">
                  <label>Email:</label>
                  <span>admin@evnzon.in</span>
                </div>
                <div className="profile-detail-item">
                  <label>Role:</label>
                  <span>Administrator</span>
                </div>
                {/* <div className="profile-detail-item">
                  <label>Status:</label>
                  <span className="status-active">Active</span>
                </div> */}
              </div>
            </div>
            <div className="profile-modal-footer">
              {/* <Link to="/profile" className="profile-modal-btn-settings" onClick={toggleProfileModal}>
                Profile Settings
              </Link> */}
              <button className="profile-modal-btn-logout" onClick={() => {
                toggleProfileModal();
                handleLogout();
              }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getAuthToken());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!getAuthToken());
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleProfileModal = () => setIsProfileModalOpen(!isProfileModalOpen);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      clearAuthToken();
      setIsLoggedIn(false);
      setIsProfileModalOpen(false);
    }
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <Login setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <MainAppLayout
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                handleLogout={handleLogout}
                isProfileModalOpen={isProfileModalOpen}
                toggleProfileModal={toggleProfileModal}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;



// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
// import SidebarComponent from './components/SidebarComponent';
// import Dashboard from './pages/Dashboard';
// import Login from './pages/Login';
// import { getAuthToken, clearAuthToken } from './services/apiService';
// import UserManagement from './pages/UserManagement';
// import BusinessManagement from './pages/BusinessManagement';
// import Approvals from './pages/Approvals';
// import ViewDetails from './components/ViewDetails';
// import ViewBill from './components/ViewBill';
// import Events from './pages/Events';
// import Promotions from './pages/Promotions';
// import PendingApprovals from './pages/PendingApprovals';
// import Subscriptions from './pages/Subscriptions';
// import Profile from './pages/Profile';
// import BusinessViewProfile from './pages/BusinessViewProfile';
// import { FaUserCircle } from 'react-icons/fa';
// import './App.css';

// const MainAppLayout = ({
//   isSidebarOpen,
//   toggleSidebar,
//   handleLogout,
//   isProfileDropdownOpen,
//   toggleProfileDropdown,
// }) => {
//   return (
//     <div className="app-container">
//       <header className="app-header">
//         <div className="header-left">
//           <button className="toggle-button" onClick={toggleSidebar}>
//             <span className="hamburger-line"></span>
//             <span className="hamburger-line"></span>
//             <span className="hamburger-line"></span>
//           </button>
//           <h1 className="company-name">Envzon</h1>
//         </div>
//         <div className="header-right">
//           <div className="profile-container" onClick={toggleProfileDropdown}>
//             <div className="profile-icon">
//               <FaUserCircle size={30} color="white" />
//             </div>
//             {/* <span className="admin-name">Admin</span> */}
//             <div className={`profile-dropdown ${isProfileDropdownOpen ? 'open' : ''}`}>
//               <Link to="/profile" className="dropdown-item" onClick={() => toggleProfileDropdown(false)}>Profile</Link>
//               <button className="dropdown-item" onClick={handleLogout}>Logout</button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className={`sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
//         <SidebarComponent handleLogout={handleLogout} />
//       </div>

//       <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//         <Routes>
//           <Route path="/" element={<Dashboard isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/user-management" element={<UserManagement isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/business" element={<BusinessManagement isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/content" element={<Approvals isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/view-details" element={<ViewDetails />} />
//           <Route path="/view-bill" element={<ViewBill />} />
//           <Route path="/events" element={<Events isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/promotions" element={<Promotions isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/pending-approvals" element={<PendingApprovals isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/subscriptions" element={<Subscriptions isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/profile" element={<Profile isSidebarOpen={isSidebarOpen} />} />
//           <Route path="/business-profile/:businessId" element={<BusinessViewProfile isSidebarOpen={isSidebarOpen} />} />
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </div>
//     </div>
//   );
// };

// function App() {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(() => !!getAuthToken());
//   const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

//   useEffect(() => {
//     const handleAuthChange = () => {
//       setIsLoggedIn(!!getAuthToken());
//     };
//     window.addEventListener('storage', handleAuthChange);
//     window.addEventListener('focus', handleAuthChange);
//     return () => {
//       window.removeEventListener('storage', handleAuthChange);
//       window.removeEventListener('focus', handleAuthChange);
//     };
//   }, []);

//   const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
//   const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

//   const handleLogout = () => {
//     if (window.confirm('Are you sure you want to logout?')) {
//       clearAuthToken();
//       setIsLoggedIn(false);
//     }
//   };

//   return (
//     <Router>
//       <Routes>
//         <Route
//           path="/login"
//           element={isLoggedIn ? <Navigate to="/" replace /> : <Login setIsLoggedIn={setIsLoggedIn} />}
//         />
//         <Route
//           path="/*"
//           element={
//             isLoggedIn ? (
//               <MainAppLayout
//                 isSidebarOpen={isSidebarOpen}
//                 toggleSidebar={toggleSidebar}
//                 handleLogout={handleLogout}
//                 isProfileDropdownOpen={isProfileDropdownOpen}
//                 toggleProfileDropdown={toggleProfileDropdown}
//               />
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

// // import React, { useState, useEffect } from 'react';
// // import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
// // import SidebarComponent from './components/SidebarComponent';
// // import Dashboard from './pages/Dashboard';
// // import Login from './pages/Login'; // Import the React Login component
// // import { getAuthToken, clearAuthToken } from './services/apiService'; // Import auth functions
// // import UserManagement from './pages/UserManagement';
// // import BusinessManagement from './pages/BusinessManagement';
// // import Approvals from './pages/Approvals';
// // import ViewDetails from './components/ViewDetails';
// // import ViewBill from './components/ViewBill';
// // import Events from './pages/Events';
// // import Promotions from './pages/Promotions';
// // import PendingApprovals from './pages/PendingApprovals';
// // import Subscriptions from './pages/Subscriptions';
// // import Profile from './pages/Profile';
// // import './App.css';
// // import BusinessViewProfile from './pages/BusinessViewProfile'; // Import the new component
// // import { FaUserCircle } from 'react-icons/fa'; // Import a profile icon


// // // This component will render the main application layout when the user is logged in
// // const MainAppLayout = ({
// //   isSidebarOpen,
// //   toggleSidebar,
// //   handleLogout, // Make sure this is the corrected logout function
// //   isProfileDropdownOpen,
// //   toggleProfileDropdown,
// // }) => {
// //   return (
// //     <div className="app-container">
// //       <header className="app-header">
// //         <div className="header-left">
// //           <button className="toggle-button" onClick={toggleSidebar}>
// //             <span className="hamburger-line"></span>
// //             <span className="hamburger-line"></span>
// //             <span className="hamburger-line"></span>
// //           </button>
// //           <h1 className="company-name">Envzon</h1> {/* Corrected typo from Evnazon if intended */}
// //         </div>
// //         <div className="header-right">
// //           <div className="profile-container" onClick={toggleProfileDropdown}>
// //             <div className="profile-icon">
// //               <FaUserCircle size={28} /> {/* Use the imported icon here */}
// //             </div>
// //             <span className="admin-name">Admin</span>
// //             <div className={`profile-dropdown ${isProfileDropdownOpen ? 'open' : ''}`}>
// //               <Link to="/profile" className="dropdown-item" onClick={() => toggleProfileDropdown(false)}>Profile</Link>
// //             </div>
// //           </div>
// //         </div>
// //       </header>
// //       <div className={`sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
// //         <SidebarComponent handleLogout={handleLogout} />
// //       </div>
// //       <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// //         <Routes>
// //           <Route path="/" element={<Dashboard isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/user-management" element={<UserManagement isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/business" element={<BusinessManagement isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/content" element={<Approvals isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/view-details" element={<ViewDetails />} />
// //           <Route path="/view-bill" element={<ViewBill />} />
// //           <Route path="/events" element={<Events isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/promotions" element={<Promotions isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/pending-approvals" element={<PendingApprovals isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/subscriptions" element={<Subscriptions isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/profile" element={<Profile isSidebarOpen={isSidebarOpen} />} />
// //           <Route path="/business-profile/:businessId" element={<BusinessViewProfile isSidebarOpen={isSidebarOpen} />} /> {/* Add new route */}
// //           <Route path="*" element={<Navigate to="/" replace />} /> {/* Fallback for authenticated app */}
// //         </Routes>
// //       </div>
// //     </div>
// //   );
// // };

// // function App() {
// //   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
// //   const [isLoggedIn, setIsLoggedIn] = useState(() => !!getAuthToken()); // Initialize based on token
// //   const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

// //   // Effect to update login status if token changes (e.g., logout in another tab)
// //   useEffect(() => {
// //     const handleAuthChange = () => {
// //       setIsLoggedIn(!!getAuthToken());
// //     };
// //     window.addEventListener('storage', handleAuthChange); // Listen for localStorage changes
// //     window.addEventListener('focus', handleAuthChange); // Check on tab focus
// //     return () => {
// //       window.removeEventListener('storage', handleAuthChange);
// //       window.removeEventListener('focus', handleAuthChange);
// //     };
// //   }, []);

// //   const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
// //   const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

// //   const handleLogout = () => {
// //     if (window.confirm('Are you sure you want to logout?')) {
// //       clearAuthToken(); // Clear the token
// //       setIsLoggedIn(false); // Update state
// //       // No explicit redirect to login.html; routing will handle it
// //     }
// //   };

// //   return (
// //     <Router>
// //       <Routes>
// //         <Route
// //           path="/login"
// //           element={isLoggedIn ? <Navigate to="/" replace /> : <Login setIsLoggedIn={setIsLoggedIn} />}
// //         />
// //         <Route
// //           path="/*" // All other paths for the authenticated app
// //           element={
// //             isLoggedIn ? (
// //               <MainAppLayout
// //                 isSidebarOpen={isSidebarOpen}
// //                 toggleSidebar={toggleSidebar}
// //                 handleLogout={handleLogout}
// //                 isProfileDropdownOpen={isProfileDropdownOpen}
// //                 toggleProfileDropdown={toggleProfileDropdown}
// //               />
// //             ) : (
// //               <Navigate to="/login" replace />
// //             )
// //           }
// //         />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;
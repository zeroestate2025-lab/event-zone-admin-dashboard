import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { useState } from 'react';
import './PageHeader.css';

function PageHeader({ title, showBreadcrumb = true, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

  return (
    <div className={`page-header ${isHomePage ? 'home-header' : 'inner-header'}`}>
      <div className="page-header-content">
        <div className="page-header-left">
          {showBreadcrumb && !isHomePage ? (
            <div className="breadcrumb">
              <button className="back-arrow" onClick={() => navigate(-1)}>
                ←
              </button>
              {/* <span className="breadcrumb-home" onClick={() => navigate('/')}>
                <span className="home-icon">🏠</span>
              </span> */}
              {/* <span className="breadcrumb-separator">/</span> */}
              <span className="breadcrumb-current">{title}</span>
            </div>
          ) : (
            <h1>{title}</h1>
          )}
        </div>

        {/* Profile Icon */}
        {/* <div className="header-profile-container" onClick={toggleProfileDropdown}>
          <div className="header-profile-icon">
            <FaUserCircle size={32} color={isHomePage ? "#333" : "#FC9256"} />
          </div>
          {isProfileDropdownOpen && (
            <div className="header-profile-dropdown">
              <Link to="/profile" className="header-dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                Profile
              </Link>
              <button 
                className="header-dropdown-item" 
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  if (handleLogout) handleLogout();
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
}

export default PageHeader;


// import { useNavigate, useLocation } from 'react-router-dom';
// import './PageHeader.css';

// function PageHeader({ title, showBreadcrumb = true }) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Determine if we're on the home page
//   const isHomePage = location.pathname === '/';

//   return (
//     <div className={`page-header ${isHomePage ? 'home-header' : 'inner-header'}`}>
//       {showBreadcrumb && !isHomePage && (
//         <div className="breadcrumb">
//           <button className="back-arrow" onClick={() => navigate(-1)}>
//             ←
//           </button>
//           <span className="breadcrumb-home" onClick={() => navigate('/')}>
//             <span className="home-icon">🏠</span>
//           </span>
//           <span className="breadcrumb-separator">/</span>
//           <span className="breadcrumb-current">{title}</span>
//         </div>
//       )}
//       {!showBreadcrumb && <h1>{title}</h1>}
//     </div>
//   );
// }

// export default PageHeader;

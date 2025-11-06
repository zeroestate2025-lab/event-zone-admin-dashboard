import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from '../components/PageHeader';
import "../styles/PendingApprovals.css";
import { getAllBusinessPartners } from "../services/apiService";

function PendingApprovals({ isSidebarOpen }) {
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("All Services");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const serviceDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const serviceOptions = [
    "All Services",
    "Wedding",
    "Reception",
    "Birthday",
    "Anniversary",
    "Corporate Event",
    "Catering",
    "Photography",
    "Decoration",
  ];

  const statusOptions = ["All", "Pending", "Approved", "Rejected"];

  const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);
  const toggleStatusDropdown = () => setIsStatusDropdownOpen(!isStatusDropdownOpen);

  const handleServiceSelect = (value) => {
    setSelectedService(value);
    setIsServiceDropdownOpen(false);
  };

  const handleStatusSelect = (value) => {
    setSelectedStatus(value);
    setIsStatusDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
        setIsServiceDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const data = await getAllBusinessPartners();
        setAllBusinesses(data || []);
      } catch (err) {
        console.error("Failed to fetch business partners:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => {
    let currentBusinesses = [...allBusinesses];

    if (selectedStatus === "Pending") {
      currentBusinesses = currentBusinesses.filter((b) => !b.isApproved && !b.isRejected);
    } else if (selectedStatus === "Approved") {
      currentBusinesses = currentBusinesses.filter((b) => b.isApproved);
    } else if (selectedStatus === "Rejected") {
      currentBusinesses = currentBusinesses.filter((b) => b.isRejected);
    }

    if (selectedService !== "All Services") {
      currentBusinesses = currentBusinesses.filter(
        (b) =>
          b.serviceProvided &&
          b.serviceProvided.toLowerCase().includes(selectedService.toLowerCase())
      );
    }

    if (searchTerm) {
      currentBusinesses = currentBusinesses.filter(business =>
        business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.id?.toString().includes(searchTerm)
      );
    }

    return currentBusinesses;
  }, [allBusinesses, selectedService, selectedStatus, searchTerm]);

  return (
    <div className={`pending-approvals ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <PageHeader title="Approvals" showBreadcrumb={true} />

      <div className="pending-approvals-actions">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        {/* <div className="filter-button">
          <span className="filter-icon">🗓️</span> Today
        </div> */}
      </div>

      {loading && <p className="loading-message">Loading pending approvals...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      <div className="pending-table-container">
        <table className="pending-table">
          <thead>
            <tr>
              <th>Business Name</th>
              <th>
                <div className="services-dropdown" ref={serviceDropdownRef}>
                  <div className="services-dropdown-header" onClick={toggleServiceDropdown}>
                    Services <span className="services-dropdown-arrow">▼</span>
                  </div>
                  {isServiceDropdownOpen && (
                    <ul className="services-dropdown-options">
                      {serviceOptions.map((option) => (
                        <li
                          key={option}
                          className={`services-dropdown-option ${selectedService === option ? 'active' : ''}`}
                          onClick={() => handleServiceSelect(option)}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </th>
              <th>Phone Number</th>
              <th>Plan</th>
              <th>
                <div className="status-dropdown" ref={statusDropdownRef}>
                  <div className="status-dropdown-header" onClick={toggleStatusDropdown}>
                    Status <span className="status-dropdown-arrow">▼</span>
                  </div>
                  {isStatusDropdownOpen && (
                    <ul className="status-dropdown-options">
                      {statusOptions.map((option) => (
                        <li
                          key={option}
                          className={`status-dropdown-option ${selectedStatus === option ? 'active' : ''}`}
                          onClick={() => handleStatusSelect(option)}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business, index) => (
                <tr key={business.id || index}>
                  <td>{business.businessName || "N/A"}</td>
                  <td>{business.serviceProvided || "N/A"}</td>
                  <td>{business.phoneNumber || "N/A"}</td>
                  <td>3 Months</td>
                  <td>
                    <span className={`status-badge ${business.isApproved ? 'approved' : business.isRejected ? 'rejected' : 'pending'}`}>
                      {business.isApproved ? 'Approved' : business.isRejected ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/business-profile/${business.id}`} className="view-link">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : !loading && !error ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: '20px' }}>
                  {searchTerm ? 'No businesses found matching your search.' : 'No businesses found.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PendingApprovals;


// import { useState, useEffect, useMemo } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import PageHeader from '../components/PageHeader';
// import "../styles/PendingApprovals.css";
// import { getAllBusinessPartners } from "../services/apiService";

// function PendingApprovals({ isSidebarOpen }) {
//   const [allBusinesses, setAllBusinesses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigate = useNavigate();

//   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
//   const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
//   const [selectedService, setSelectedService] = useState("All Services");
//   const [selectedStatus, setSelectedStatus] = useState("Pending");

//   // All offered services
//   const serviceOptions = [
//     "All Services",
//     "Wedding",
//     "Reception",
//     "Birthday",
//     "Anniversary",
//     "Corporate Event",
//     "Catering",
//     "Photography",
//     "Decoration",
//   ];

//   // Status options
//   const statusOptions = ["All", "Pending", "Approved", "Rejected"];

//   // Dropdown toggles
//   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);
//   const toggleStatusDropdown = () => setIsStatusDropdownOpen(!isStatusDropdownOpen);

//   // Selection handlers
//   const handleServiceSelect = (value) => {
//     setSelectedService(value);
//     setIsServiceDropdownOpen(false);
//   };

//   const handleStatusSelect = (value) => {
//     setSelectedStatus(value);
//     setIsStatusDropdownOpen(false);
//   };

//   // Fetch Businesses
//   useEffect(() => {
//     const fetchBusinesses = async () => {
//       setLoading(true);
//       try {
//         const data = await getAllBusinessPartners();
//         setAllBusinesses(data || []);
//       } catch (err) {
//         console.error("Failed to fetch business partners:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchBusinesses();
//   }, []);

//   // Filtering logic
//   const filteredBusinesses = useMemo(() => {
//     let currentBusinesses = [...allBusinesses];

//     // Filter by approval status
//     if (selectedStatus === "Pending") {
//       currentBusinesses = currentBusinesses.filter((b) => !b.isApproved && !b.isRejected);
//     } else if (selectedStatus === "Approved") {
//       currentBusinesses = currentBusinesses.filter((b) => b.isApproved);
//     } else if (selectedStatus === "Rejected") {
//       currentBusinesses = currentBusinesses.filter((b) => b.isRejected);
//     }

//     // Filter by service
//     if (selectedService !== "All Services") {
//       currentBusinesses = currentBusinesses.filter(
//         (b) =>
//           b.serviceProvided &&
//           b.serviceProvided.toLowerCase().includes(selectedService.toLowerCase())
//       );
//     }

//     // Filter by search term
//     if (searchTerm) {
//       currentBusinesses = currentBusinesses.filter(business =>
//         business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         business.id?.toString().includes(searchTerm)
//       );
//     }

//     return currentBusinesses;
//   }, [allBusinesses, selectedService, selectedStatus, searchTerm]);

//   return (
//     <div className={`pending-approvals ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
//       <PageHeader title="Approvals" showBreadcrumb={true} />

//       {/* Header Actions */}
//       <div className="pending-approvals-actions">
//         <div className="search-bar">
//           <input 
//             type="text" 
//             placeholder="Search" 
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <span className="search-icon">🔍</span>
//         </div>
//         <div className="filter-button">
//           <span className="filter-icon">🗓️</span> Today
//         </div>
//       </div>

//       {loading && <p className="loading-message">Loading pending approvals...</p>}
//       {error && <p className="error-message">Error: {error}</p>}

//       {/* Table */}
//       <div className="pending-table-container">
//         <table className="pending-table">
//           <thead>
//             <tr>
//               <th>Businessname</th>
//               <th>
//                 <div className="catering-dropdown">
//                   <div className="catering-dropdown-header" onClick={toggleServiceDropdown}>
//                     Catering <span className="catering-dropdown-arrow">▼</span>
//                   </div>
//                   {isServiceDropdownOpen && (
//                     <ul className="catering-dropdown-options">
//                       {serviceOptions.map((option) => (
//                         <li
//                           key={option}
//                           className="catering-dropdown-option"
//                           onClick={() => handleServiceSelect(option)}
//                         >
//                           {option}
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               </th>
//               <th>Phone Number</th>
//               <th>Plan</th>
//               <th>
//                 <div className="paid-dropdown">
//                   <div className="paid-dropdown-header" onClick={toggleStatusDropdown}>
//                     Paid <span className="paid-dropdown-arrow">▼</span>
//                   </div>
//                   {isStatusDropdownOpen && (
//                     <ul className="paid-dropdown-options">
//                       {statusOptions.map((option) => (
//                         <li
//                           key={option}
//                           className="paid-dropdown-option"
//                           onClick={() => handleStatusSelect(option)}
//                         >
//                           {option}
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               </th>
//               <th></th>
//             </tr>
//           </thead>
//           <tbody>
//             {!loading && !error && filteredBusinesses.length > 0 ? (
//               filteredBusinesses.map((business, index) => (
//                 <tr key={business.id || index}>
//                   <td>{business.businessName || "N/A"}</td>
//                   <td>{business.serviceProvided || "Catering"}</td>
//                   <td>{business.phoneNumber || "N/A"}</td>
//                   <td>3 Months</td>
//                   <td>Paid</td>
//                   <td>
//                     <Link to={`/business-profile/${business.id}`} className="view-link">
//                       View
//                     </Link>
//                   </td>
//                 </tr>
//               ))
//             ) : !loading && !error ? (
//               <tr>
//                 <td colSpan="6" style={{ textAlign: "center", padding: '20px' }}>
//                   {searchTerm ? 'No businesses found matching your search.' : 'No businesses found.'}
//                 </td>
//               </tr>
//             ) : null}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default PendingApprovals;

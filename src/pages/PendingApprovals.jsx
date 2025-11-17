import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from '../components/PageHeader';
import "../styles/PendingApprovals.css";
import { getAllBusinessPartners, getAllPaymentsWithUsers, deleteBusinessPartner } from "../services/apiService";
import { FaCalendarAlt, FaTrash, FaSpinner } from 'react-icons/fa';
import ConfirmModal from '../components/ConfirmModal';

function PendingApprovals({ isSidebarOpen }) {
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    businessToDelete: null,
    businessName: ''
  });
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
    "Puberty Function",
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
    fetchBusinessesAndPayments();
  }, []);

  const fetchBusinessesAndPayments = async () => {
    setLoading(true);
    try {
      // Fetch both businesses and payments
      const [businessesData, paymentsData] = await Promise.all([
        getAllBusinessPartners(),
        getAllPaymentsWithUsers().catch(err => {
          console.warn('Payment fetch failed, continuing without payment data:', err);
          return [];
        })
      ]);

      // Create a map of businessId -> payment
      const paymentsByBusiness = {};
      (paymentsData || []).forEach(payment => {
        if (payment.user && payment.user.businessPartnerId) {
          paymentsByBusiness[payment.user.businessPartnerId] = payment;
        }
      });

      setPaymentsMap(paymentsByBusiness);
      setAllBusinesses(businessesData || []);
    } catch (err) {
      console.error("Failed to fetch business partners:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format plan type
  const formatPlanType = (planType) => {
    if (!planType) return 'Legacy Plan';
    const formatted = planType.replace('_', ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Helper function to check if subscription is about to expire (within 7 days)
  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    try {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 7;
    } catch (e) {
      return false;
    }
  };

  // Helper function to get subscription status
  const getSubscriptionStatus = (payment, isApproved) => {
    // If not approved by admin, show pending regardless of payment
    if (!isApproved) {
      return { text: 'Pending Approval', class: 'pending-approval', isLegacy: false };
    }

    // No payment means legacy/existing business - show as Active
    if (!payment) {
      return { text: 'Active', class: 'active', isLegacy: true };
    }

    // Check payment status
    const isPaymentSuccess = payment.status === 'success' || 
                           payment.status === 'completed' || 
                           payment.status === 'paid';

    if (!isPaymentSuccess) {
      return { text: 'Pending Payment', class: 'pending', isLegacy: false };
    }

    // Check expiry
    if (payment.expiredAt) {
      try {
        const expiryDate = new Date(payment.expiredAt);
        const now = new Date();

        if (expiryDate < now) {
          return { text: 'Expired', class: 'expired', isLegacy: false };
        }

        if (isExpiringSoon(payment.expiredAt)) {
          return { text: 'Expiring Soon', class: 'expiring', isLegacy: false };
        }
      } catch (e) {
        console.error('Error checking expiry:', e);
      }
    }

    return { text: 'Active', class: 'active', isLegacy: false };
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (businessId, businessName) => {
    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete "${businessName}"? This action cannot be undone.`,
      businessToDelete: businessId,
      businessName: businessName
    });
  };

  // Handle actual deletion after confirmation
  const handleDeleteBusiness = async () => {
    const businessId = confirmModal.businessToDelete;
    setConfirmModal({ ...confirmModal, isOpen: false });
    setDeletingId(businessId);
    setError(null);

    try {
      await deleteBusinessPartner(businessId);
      
      // Remove from local state
      setAllBusinesses(prevBusinesses => 
        prevBusinesses.filter(business => business.id !== businessId)
      );
    } catch (err) {
      console.error(`Failed to delete business ${businessId}:`, err);
      setError('Failed to delete business. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

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
              <th>Subscription</th>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business, index) => {
                const payment = paymentsMap[business.id];
                const subscriptionStatus = getSubscriptionStatus(payment, business.isApproved);
                const isDeleting = deletingId === business.id;

                return (
                  <tr key={business.id || index}>
                    <td>{business.businessName || "N/A"}</td>
                    <td>{business.serviceProvided || "N/A"}</td>
                    <td>{business.phoneNumber || "N/A"}</td>
                    <td>
                      <div className="subscription-cell">
                        {payment ? (
                          <>
                            <div className="subscription-plan">
                              {formatPlanType(payment.planType)}
                            </div>
                            {payment.createdAt && payment.status && 
                             (payment.status === 'success' || payment.status === 'completed' || payment.status === 'paid') && (
                              <div className="subscription-dates">
                                <div className="date-item">
                                  <FaCalendarAlt className="calendar-icon" />
                                  <span className="date-label">Started:</span>
                                  <span className="date-value">{formatDate(payment.createdAt)}</span>
                                </div>
                                {payment.expiredAt && (
                                  <div className="date-item">
                                    <FaCalendarAlt className="calendar-icon" />
                                    <span className="date-label">Expires:</span>
                                    <span className={`date-value ${isExpiringSoon(payment.expiredAt) ? 'expiring' : ''}`}>
                                      {formatDate(payment.expiredAt)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {payment.status && 
                             payment.status !== 'success' && 
                             payment.status !== 'completed' && 
                             payment.status !== 'paid' && (
                              <div className="payment-pending-label">
                                Awaiting Payment
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="subscription-plan legacy">
                              Legacy Plan
                            </div>
                            <div className="legacy-note">
                              Pre-existing Business
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${subscriptionStatus.class}`}>
                        {subscriptionStatus.text}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/business-profile/${business.id}`} className="view-link">
                          View
                        </Link>
                        <button
                          onClick={() => showDeleteConfirmation(business.id, business.businessName)}
                          className="delete-business-button"
                          disabled={isDeleting}
                          title="Delete Business"
                        >
                          {isDeleting ? (
                            <FaSpinner className="spinner-icon" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={handleDeleteBusiness}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default PendingApprovals;

// import { useState, useEffect, useMemo, useRef } from "react";
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
//   const [selectedStatus, setSelectedStatus] = useState("All");

//   const serviceDropdownRef = useRef(null);
//   const statusDropdownRef = useRef(null);

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

//   const statusOptions = ["All", "Pending", "Approved", "Rejected"];

//   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);
//   const toggleStatusDropdown = () => setIsStatusDropdownOpen(!isStatusDropdownOpen);

//   const handleServiceSelect = (value) => {
//     setSelectedService(value);
//     setIsServiceDropdownOpen(false);
//   };

//   const handleStatusSelect = (value) => {
//     setSelectedStatus(value);
//     setIsStatusDropdownOpen(false);
//   };

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
//         setIsServiceDropdownOpen(false);
//       }
//       if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
//         setIsStatusDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

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

//   const filteredBusinesses = useMemo(() => {
//     let currentBusinesses = [...allBusinesses];

//     if (selectedStatus === "Pending") {
//       currentBusinesses = currentBusinesses.filter((b) => !b.isApproved && !b.isRejected);
//     } else if (selectedStatus === "Approved") {
//       currentBusinesses = currentBusinesses.filter((b) => b.isApproved);
//     } else if (selectedStatus === "Rejected") {
//       currentBusinesses = currentBusinesses.filter((b) => b.isRejected);
//     }

//     if (selectedService !== "All Services") {
//       currentBusinesses = currentBusinesses.filter(
//         (b) =>
//           b.serviceProvided &&
//           b.serviceProvided.toLowerCase().includes(selectedService.toLowerCase())
//       );
//     }

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
//         {/* <div className="filter-button">
//           <span className="filter-icon">🗓️</span> Today
//         </div> */}
//       </div>

//       {loading && <p className="loading-message">Loading pending approvals...</p>}
//       {error && <p className="error-message">Error: {error}</p>}

//       <div className="pending-table-container">
//         <table className="pending-table">
//           <thead>
//             <tr>
//               <th>Business Name</th>
//               <th>
//                 <div className="services-dropdown" ref={serviceDropdownRef}>
//                   <div className="services-dropdown-header" onClick={toggleServiceDropdown}>
//                     Services <span className="services-dropdown-arrow">▼</span>
//                   </div>
//                   {isServiceDropdownOpen && (
//                     <ul className="services-dropdown-options">
//                       {serviceOptions.map((option) => (
//                         <li
//                           key={option}
//                           className={`services-dropdown-option ${selectedService === option ? 'active' : ''}`}
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
//                 <div className="status-dropdown" ref={statusDropdownRef}>
//                   <div className="status-dropdown-header" onClick={toggleStatusDropdown}>
//                     Status <span className="status-dropdown-arrow">▼</span>
//                   </div>
//                   {isStatusDropdownOpen && (
//                     <ul className="status-dropdown-options">
//                       {statusOptions.map((option) => (
//                         <li
//                           key={option}
//                           className={`status-dropdown-option ${selectedStatus === option ? 'active' : ''}`}
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
//                   <td>{business.serviceProvided || "N/A"}</td>
//                   <td>{business.phoneNumber || "N/A"}</td>
//                   <td>3 Months</td>
//                   <td>
//                     <span className={`status-badge ${business.isApproved ? 'approved' : business.isRejected ? 'rejected' : 'pending'}`}>
//                       {business.isApproved ? 'Approved' : business.isRejected ? 'Rejected' : 'Pending'}
//                     </span>
//                   </td>
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


// // import { useState, useEffect, useMemo } from "react";
// // import { Link, useNavigate } from "react-router-dom";
// // import PageHeader from '../components/PageHeader';
// // import "../styles/PendingApprovals.css";
// // import { getAllBusinessPartners } from "../services/apiService";

// // function PendingApprovals({ isSidebarOpen }) {
// //   const [allBusinesses, setAllBusinesses] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const navigate = useNavigate();

// //   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
// //   const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
// //   const [selectedService, setSelectedService] = useState("All Services");
// //   const [selectedStatus, setSelectedStatus] = useState("Pending");

// //   // All offered services
// //   const serviceOptions = [
// //     "All Services",
// //     "Wedding",
// //     "Reception",
// //     "Birthday",
// //     "Anniversary",
// //     "Corporate Event",
// //     "Catering",
// //     "Photography",
// //     "Decoration",
// //   ];

// //   // Status options
// //   const statusOptions = ["All", "Pending", "Approved", "Rejected"];

// //   // Dropdown toggles
// //   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);
// //   const toggleStatusDropdown = () => setIsStatusDropdownOpen(!isStatusDropdownOpen);

// //   // Selection handlers
// //   const handleServiceSelect = (value) => {
// //     setSelectedService(value);
// //     setIsServiceDropdownOpen(false);
// //   };

// //   const handleStatusSelect = (value) => {
// //     setSelectedStatus(value);
// //     setIsStatusDropdownOpen(false);
// //   };

// //   // Fetch Businesses
// //   useEffect(() => {
// //     const fetchBusinesses = async () => {
// //       setLoading(true);
// //       try {
// //         const data = await getAllBusinessPartners();
// //         setAllBusinesses(data || []);
// //       } catch (err) {
// //         console.error("Failed to fetch business partners:", err);
// //         setError(err.message);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchBusinesses();
// //   }, []);

// //   // Filtering logic
// //   const filteredBusinesses = useMemo(() => {
// //     let currentBusinesses = [...allBusinesses];

// //     // Filter by approval status
// //     if (selectedStatus === "Pending") {
// //       currentBusinesses = currentBusinesses.filter((b) => !b.isApproved && !b.isRejected);
// //     } else if (selectedStatus === "Approved") {
// //       currentBusinesses = currentBusinesses.filter((b) => b.isApproved);
// //     } else if (selectedStatus === "Rejected") {
// //       currentBusinesses = currentBusinesses.filter((b) => b.isRejected);
// //     }

// //     // Filter by service
// //     if (selectedService !== "All Services") {
// //       currentBusinesses = currentBusinesses.filter(
// //         (b) =>
// //           b.serviceProvided &&
// //           b.serviceProvided.toLowerCase().includes(selectedService.toLowerCase())
// //       );
// //     }

// //     // Filter by search term
// //     if (searchTerm) {
// //       currentBusinesses = currentBusinesses.filter(business =>
// //         business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //         business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //         business.id?.toString().includes(searchTerm)
// //       );
// //     }

// //     return currentBusinesses;
// //   }, [allBusinesses, selectedService, selectedStatus, searchTerm]);

// //   return (
// //     <div className={`pending-approvals ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
// //       <PageHeader title="Approvals" showBreadcrumb={true} />

// //       {/* Header Actions */}
// //       <div className="pending-approvals-actions">
// //         <div className="search-bar">
// //           <input 
// //             type="text" 
// //             placeholder="Search" 
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //           />
// //           <span className="search-icon">🔍</span>
// //         </div>
// //         <div className="filter-button">
// //           <span className="filter-icon">🗓️</span> Today
// //         </div>
// //       </div>

// //       {loading && <p className="loading-message">Loading pending approvals...</p>}
// //       {error && <p className="error-message">Error: {error}</p>}

// //       {/* Table */}
// //       <div className="pending-table-container">
// //         <table className="pending-table">
// //           <thead>
// //             <tr>
// //               <th>Businessname</th>
// //               <th>
// //                 <div className="catering-dropdown">
// //                   <div className="catering-dropdown-header" onClick={toggleServiceDropdown}>
// //                     Catering <span className="catering-dropdown-arrow">▼</span>
// //                   </div>
// //                   {isServiceDropdownOpen && (
// //                     <ul className="catering-dropdown-options">
// //                       {serviceOptions.map((option) => (
// //                         <li
// //                           key={option}
// //                           className="catering-dropdown-option"
// //                           onClick={() => handleServiceSelect(option)}
// //                         >
// //                           {option}
// //                         </li>
// //                       ))}
// //                     </ul>
// //                   )}
// //                 </div>
// //               </th>
// //               <th>Phone Number</th>
// //               <th>Plan</th>
// //               <th>
// //                 <div className="paid-dropdown">
// //                   <div className="paid-dropdown-header" onClick={toggleStatusDropdown}>
// //                     Paid <span className="paid-dropdown-arrow">▼</span>
// //                   </div>
// //                   {isStatusDropdownOpen && (
// //                     <ul className="paid-dropdown-options">
// //                       {statusOptions.map((option) => (
// //                         <li
// //                           key={option}
// //                           className="paid-dropdown-option"
// //                           onClick={() => handleStatusSelect(option)}
// //                         >
// //                           {option}
// //                         </li>
// //                       ))}
// //                     </ul>
// //                   )}
// //                 </div>
// //               </th>
// //               <th></th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {!loading && !error && filteredBusinesses.length > 0 ? (
// //               filteredBusinesses.map((business, index) => (
// //                 <tr key={business.id || index}>
// //                   <td>{business.businessName || "N/A"}</td>
// //                   <td>{business.serviceProvided || "Catering"}</td>
// //                   <td>{business.phoneNumber || "N/A"}</td>
// //                   <td>3 Months</td>
// //                   <td>Paid</td>
// //                   <td>
// //                     <Link to={`/business-profile/${business.id}`} className="view-link">
// //                       View
// //                     </Link>
// //                   </td>
// //                 </tr>
// //               ))
// //             ) : !loading && !error ? (
// //               <tr>
// //                 <td colSpan="6" style={{ textAlign: "center", padding: '20px' }}>
// //                   {searchTerm ? 'No businesses found matching your search.' : 'No businesses found.'}
// //                 </td>
// //               </tr>
// //             ) : null}
// //           </tbody>
// //         </table>
// //       </div>
// //     </div>
// //   );
// // }

// // export default PendingApprovals;

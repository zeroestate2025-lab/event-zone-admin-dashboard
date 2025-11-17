import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import '../styles/BusinessManagement.css';
import { 
  getAllBusinessPartners, 
  deleteBusinessPartner,
  createUserByAdmin,
  createBusinessPartner,
  getAllPaymentsWithUsers
} from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaSpinner, FaPlus, FaCalendarAlt } from 'react-icons/fa';
import ConfirmModal from '../components/ConfirmModal';

function BusinessManagement({ isSidebarOpen }) {
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({});
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [errorList, setErrorList] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [createdUserId, setCreatedUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  
  const [userFormData, setUserFormData] = useState({
    phoneNumber: '',
    name: '',
    isAdmin: false
  });
  
  const [businessFormData, setBusinessFormData] = useState({
    proprietorName: '',
    businessName: '',
    pincode: '',
    phoneNumber: '',
    email: '',
    serviceProvided: '',
    location: '',
    state: '',
    district: '',
    price: '',
    aproxLatitude: '',
    aproxLongitude: '',
    isApproved: true,
    moreDetails: '',
    subCategories: ''
  });
  
  const [selectedImages, setSelectedImages] = useState([]);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    businessToDelete: null,
    businessName: ''
  });

  const navigate = useNavigate();

  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('All Services');
  
  const serviceFilterOptions = ['All Services', 'Wedding', 'Reception', 'Birthday', 'Anniversary', 'Corporate Event', 'Puberty Function'];

  const toggleServiceDropdown = () => {
    setIsServiceDropdownOpen(!isServiceDropdownOpen);
  };

  const handleServiceSelect = (value) => {
    setSelectedService(value);
    setIsServiceDropdownOpen(false);
  };

  useEffect(() => {
    loadVendorsAndPayments();
  }, []);

  const loadVendorsAndPayments = async () => {
    try {
      setIsLoadingList(true);
      setErrorList(null);
      
      // Fetch both businesses and payments
      const [businessesData, paymentsData] = await Promise.all([
        getAllBusinessPartners(),
        getAllPaymentsWithUsers().catch(err => {
          console.warn('Payment fetch failed, continuing without payment data:', err);
          return []; // Return empty array if payment fetch fails
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
      
      // Filter businesses: Only show approved ones
      // For NEW businesses: Check payment and expiry
      // For EXISTING businesses: Show regardless of payment (legacy support)
      const visibleBusinesses = (businessesData || []).filter(business => {
        // Must be approved by admin
        if (!business.isApproved) return false;
        
        const payment = paymentsByBusiness[business.id];
        
        // If payment exists, check its status and expiry
        if (payment) {
          // Only consider successful payments
          const isPaymentSuccess = 
            payment.status === 'success' || 
            payment.status === 'completed' || 
            payment.status === 'paid';
          
          if (!isPaymentSuccess) {
            // Payment exists but not successful - hide this business
            return false;
          }
          
          // Check if subscription has expired
          if (payment.expiredAt) {
            const expiryDate = new Date(payment.expiredAt);
            const now = new Date();
            
            if (expiryDate < now) {
              // Payment expired - hide this business
              return false;
            }
          }
        }
        
        // Show business if:
        // 1. No payment data (existing/legacy business)
        // 2. Payment is successful and not expired
        return true;
      });
      
      setAllBusinesses(visibleBusinesses);
      setFilteredBusinesses(visibleBusinesses);
    } catch (err) {
      setErrorList(err);
      console.error("Failed to fetch business partners list:", err);
      setAllBusinesses([]);
      setFilteredBusinesses([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    let businessesToFilter = allBusinesses;

    if (selectedService !== 'All Services') {
      businessesToFilter = businessesToFilter.filter(
        business => business.serviceProvided === selectedService
      );
    }

    if (searchTerm) {
      businessesToFilter = businessesToFilter.filter(business =>
        business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.id?.toString().includes(searchTerm)
      );
    }

    setFilteredBusinesses(businessesToFilter);
  }, [selectedService, searchTerm, allBusinesses]);

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
  const getSubscriptionStatus = (payment) => {
    // No payment means legacy/existing business - show as Active
    if (!payment) {
      return { text: 'Active', class: 'active', isLegacy: true };
    }
    
    // Check payment status
    const isPaymentSuccess = 
      payment.status === 'success' || 
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

  const showDeleteConfirmation = (businessId, businessName) => {
    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete "${businessName}"? This action cannot be undone.`,
      businessToDelete: businessId,
      businessName: businessName
    });
  };

  const handleDeleteBusiness = async () => {
    const businessId = confirmModal.businessToDelete;
    setConfirmModal({ ...confirmModal, isOpen: false });
    setDeletingId(businessId);
    setErrorList(null);

    try {
      await deleteBusinessPartner(businessId);
      
      setAllBusinesses(prevBusinesses => 
        prevBusinesses.filter(business => business.id !== businessId)
      );
      setFilteredBusinesses(prevBusinesses => 
        prevBusinesses.filter(business => business.id !== businessId)
      );
    } catch (err) {
      console.error(`Failed to delete business ${businessId}:`, err);
      setErrorList(err);
    } finally {
      setDeletingId(null);
    }
  };

  const openAddBusinessModal = () => {
    setIsAddBusinessModalOpen(true);
    setCurrentStep(1);
    setCreatedUserId(null);
    setModalError('');
    setModalSuccess('');
    setUserFormData({
      phoneNumber: '',
      name: '',
      isAdmin: false
    });
    setBusinessFormData({
      proprietorName: '',
      businessName: '',
      pincode: '',
      phoneNumber: '',
      email: '',
      serviceProvided: '',
      location: '',
      state: '',
      district: '',
      price: '',
      aproxLatitude: '',
      aproxLongitude: '',
      isApproved: true,
      moreDetails: '',
      subCategories: ''
    });
    setSelectedImages([]);
  };

  const closeAddBusinessModal = () => {
    setIsAddBusinessModalOpen(false);
    setCurrentStep(1);
    setCreatedUserId(null);
    setModalError('');
    setModalSuccess('');
  };

  const handleUserInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBusinessInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBusinessFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      const userData = {
        phoneNumber: userFormData.phoneNumber,
        name: userFormData.name,
        isAdmin: userFormData.isAdmin
      };

      console.log('Attempting to create user:', userData);
      const response = await createUserByAdmin(userData);
      console.log('User creation response:', response);
      
      setCreatedUserId(response.id || response.userId);
      setModalSuccess('User created successfully! Now add business details.');
      
      setBusinessFormData(prev => ({
        ...prev,
        phoneNumber: userFormData.phoneNumber,
        proprietorName: userFormData.name
      }));
      
      setTimeout(() => {
        setCurrentStep(2);
        setModalSuccess('');
      }, 1000);
    } catch (error) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        errorMessage = 'A user with this phone number already exists. Please use a different number.';
      } else if (error.message?.includes('502')) {
        errorMessage = 'Server error (502). Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setModalError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      const formData = new FormData();
      
      Object.keys(businessFormData).forEach(key => {
        if (businessFormData[key]) {
          formData.append(key, businessFormData[key]);
        }
      });

      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      console.log('Creating business with form data');
      const response = await createBusinessPartner(formData);
      console.log('Business created successfully:', response);
      
      setModalSuccess('Business created successfully! Reloading vendors...');
      
      await loadVendorsAndPayments();
      
      setTimeout(() => {
        closeAddBusinessModal();
      }, 2000);
    } catch (error) {
      console.error('Error creating business:', error);
      
      let errorMessage = 'Failed to create business. Please try again.';
      
      if (error.message?.includes('502')) {
        errorMessage = 'Server error (502). Please check if the backend is running.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setModalError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedVendorCount = allBusinesses.length;

  return (
    <div className={`business-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <PageHeader title="Business Management" showBreadcrumb={true} />

      <div className="business-management-actions">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="header-right-actions">
          <div className="total-vendors">
            Total Vendors : {isLoadingList ? '...' : approvedVendorCount}
          </div>
          <button className="add-business-btn" onClick={openAddBusinessModal}>
            <FaPlus /> Add Business
          </button>
        </div>
      </div>

      {isLoadingList && <p className="loading-message">Loading vendors list...</p>}
      {errorList && (
        <p className="error-message">
          Error: {typeof errorList === 'string' ? errorList : errorList.message || 'Unknown error'}
        </p>
      )}

      <div className="business-table-container">
        <table className="business-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>
                <div className="catering-dropdown">
                  <div className="catering-dropdown-header" onClick={toggleServiceDropdown}>
                    Services <span className="catering-dropdown-arrow">▼</span>
                  </div>
                  {isServiceDropdownOpen && (
                    <ul className="catering-dropdown-options">
                      {serviceFilterOptions.map((option) => (
                        <li
                          key={option}
                          className="catering-dropdown-option"
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoadingList && !errorList && filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => {
                const payment = paymentsMap[business.id];
                const subscriptionStatus = getSubscriptionStatus(payment);
                const isDeleting = deletingId === business.id;
                
                return (
                  <tr key={business.id}>
                    <td>{business.businessName}</td>
                    <td>{business.serviceProvided || 'Catering'}</td>
                    <td>{business.phoneNumber}</td>
                    <td>
                      <div className="subscription-info">
                        {payment ? (
                          <>
                            <div className="plan-type">
                              {formatPlanType(payment.planType)}
                            </div>
                            {payment.createdAt && payment.status && 
                             (payment.status === 'success' || payment.status === 'completed' || payment.status === 'paid') && (
                              <div className="subscription-dates">
                                <div className="date-item">
                                  <FaCalendarAlt className="date-icon" />
                                  <span className="date-label">Start:</span>
                                  <span className="date-value">{formatDate(payment.createdAt)}</span>
                                </div>
                                {payment.expiredAt && (
                                  <div className="date-item">
                                    <FaCalendarAlt className="date-icon" />
                                    <span className="date-label">End:</span>
                                    <span className="date-value">{formatDate(payment.expiredAt)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {(!payment.createdAt || payment.status === 'pending') && (
                              <div className="no-subscription-dates">
                                <span className="awaiting-payment">Awaiting Payment</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="legacy-subscription">
                            <div className="plan-type">Legacy Plan</div>
                            <div className="legacy-note">
                              <span className="legacy-text">Pre-existing Business</span>
                            </div>
                          </div>
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
                        <Link 
                          to={`/business-profile/${business.id}`} 
                          className="view-profile-link"
                        >
                          view profile
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
            ) : !isLoadingList && !errorList && filteredBusinesses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  {searchTerm ? 'No vendors found matching your search.' : 'No active vendors found.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {isAddBusinessModalOpen && (
        <div className="add-business-modal-overlay" onClick={closeAddBusinessModal}>
          <div className="add-business-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-business-modal-header">
              <h2>{currentStep === 1 ? 'Step 1: Create User' : 'Step 2: Add Business Details'}</h2>
              <button className="add-business-modal-close" onClick={closeAddBusinessModal}>×</button>
            </div>

            <div className="add-business-modal-body">
              {modalError && (
                <div className="modal-error-message">
                  <strong>Error:</strong> {modalError}
                  <br />
                  <small>Check browser console (F12) for more details</small>
                </div>
              )}
              {modalSuccess && <div className="modal-success-message">{modalSuccess}</div>}

              {currentStep === 1 && (
                <form onSubmit={handleCreateUser} className="add-business-form">
                  <div className="form-step-indicator">
                    <div className="step-indicator active">1</div>
                    <div className="step-line"></div>
                    <div className="step-indicator">2</div>
                  </div>

                  <div className="form-group">
                    <label>Phone Number*</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={userFormData.phoneNumber}
                      onChange={handleUserInputChange}
                      placeholder="+919876543210"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Name*</label>
                    <input
                      type="text"
                      name="name"
                      value={userFormData.name}
                      onChange={handleUserInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  {/* <div className="form-group-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        name="isAdmin"
                        checked={userFormData.isAdmin}
                        onChange={handleUserInputChange}
                      />
                      <span>Is Admin</span>
                    </label>
                  </div> */}

                  <div className="form-actions">
                    <button type="button" onClick={closeAddBusinessModal} className="btn-cancel">
                      Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="spinner" /> Creating...
                        </>
                      ) : (
                        'Create User & Continue'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {currentStep === 2 && (
                <form onSubmit={handleCreateBusiness} className="add-business-form">
                  <div className="form-step-indicator">
                    <div className="step-indicator completed">✓</div>
                    <div className="step-line completed"></div>
                    <div className="step-indicator active">2</div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Business Name*</label>
                      <input
                        type="text"
                        name="businessName"
                        value={businessFormData.businessName}
                        onChange={handleBusinessInputChange}
                        placeholder="My Business"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Proprietor Name*</label>
                      <input
                        type="text"
                        name="proprietorName"
                        value={businessFormData.proprietorName}
                        onChange={handleBusinessInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number*</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={businessFormData.phoneNumber}
                        onChange={handleBusinessInputChange}
                        placeholder="+919876543210"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email*</label>
                      <input
                        type="email"
                        name="email"
                        value={businessFormData.email}
                        onChange={handleBusinessInputChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Service Provided*</label>
                      <select
                        name="serviceProvided"
                        value={businessFormData.serviceProvided}
                        onChange={handleBusinessInputChange}
                        required
                      >
                        <option value="">Select Service</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Reception">Reception</option>
                        <option value="Birthday">Birthday</option>
                        <option value="Anniversary">Anniversary</option>
                        <option value="Corporate Event">Corporate Event</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Price</label>
                      <input
                        type="number"
                        name="price"
                        value={businessFormData.price}
                        onChange={handleBusinessInputChange}
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        name="location"
                        value={businessFormData.location}
                        onChange={handleBusinessInputChange}
                        placeholder="City"
                      />
                    </div>

                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        name="state"
                        value={businessFormData.state}
                        onChange={handleBusinessInputChange}
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>District</label>
                      <input
                        type="text"
                        name="district"
                        value={businessFormData.district}
                        onChange={handleBusinessInputChange}
                        placeholder="District"
                      />
                    </div>

                    <div className="form-group">
                      <label>Pincode*</label>
                      <input
                        type="text"
                        name="pincode"
                        value={businessFormData.pincode}
                        onChange={handleBusinessInputChange}
                        placeholder="12345"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitude</label>
                      <input
                        type="text"
                        name="aproxLatitude"
                        value={businessFormData.aproxLatitude}
                        onChange={handleBusinessInputChange}
                        placeholder="12.9716"
                      />
                    </div>

                    <div className="form-group">
                      <label>Longitude</label>
                      <input
                        type="text"
                        name="aproxLongitude"
                        value={businessFormData.aproxLongitude}
                        onChange={handleBusinessInputChange}
                        placeholder="77.5946"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Sub Categories (comma separated)</label>
                    <input
                      type="text"
                      name="subCategories"
                      value={businessFormData.subCategories}
                      onChange={handleBusinessInputChange}
                      placeholder="Category1, Category2"
                    />
                  </div>

                  <div className="form-group">
                    <label>More Details (JSON format)</label>
                    <textarea
                      name="moreDetails"
                      value={businessFormData.moreDetails}
                      onChange={handleBusinessInputChange}
                      placeholder='[{"name":"Detail1","detail":"Value1"}]'
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Business Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="file-input"
                    />
                    {selectedImages.length > 0 && (
                      <p className="file-count">{selectedImages.length} image(s) selected</p>
                    )}
                  </div>

                  <div className="form-group-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        name="isApproved"
                        checked={businessFormData.isApproved}
                        onChange={handleBusinessInputChange}
                      />
                      <span>Approve Business</span>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setCurrentStep(1)} className="btn-back">
                      Back
                    </button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="spinner" /> Creating...
                        </>
                      ) : (
                        'Create Business'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={handleDeleteBusiness}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default BusinessManagement;

// import { useState, useEffect } from 'react';
// import PageHeader from '../components/PageHeader';
// import '../styles/BusinessManagement.css';
// import { 
//   getAllBusinessPartners, 
//   deleteBusinessPartner,
//   createUserByAdmin,
//   createBusinessPartner,
//   getAllPaymentsWithUsers
// } from '../services/apiService';
// import { Link, useNavigate } from 'react-router-dom';
// import { FaTrash, FaSpinner, FaPlus, FaCalendarAlt } from 'react-icons/fa';
// import ConfirmModal from '../components/ConfirmModal';

// function BusinessManagement({ isSidebarOpen }) {
//   const [allBusinesses, setAllBusinesses] = useState([]);
//   const [filteredBusinesses, setFilteredBusinesses] = useState([]);
//   const [paymentsMap, setPaymentsMap] = useState({});
//   const [isLoadingList, setIsLoadingList] = useState(true);
//   const [errorList, setErrorList] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [deletingId, setDeletingId] = useState(null);
  
//   const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
//   const [currentStep, setCurrentStep] = useState(1);
//   const [createdUserId, setCreatedUserId] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [modalError, setModalError] = useState('');
//   const [modalSuccess, setModalSuccess] = useState('');
  
//   const [userFormData, setUserFormData] = useState({
//     phoneNumber: '',
//     name: '',
//     isAdmin: false
//   });
  
//   const [businessFormData, setBusinessFormData] = useState({
//     proprietorName: '',
//     businessName: '',
//     pincode: '',
//     phoneNumber: '',
//     email: '',
//     serviceProvided: '',
//     location: '',
//     state: '',
//     district: '',
//     price: '',
//     aproxLatitude: '',
//     aproxLongitude: '',
//     isApproved: true,
//     moreDetails: '',
//     subCategories: ''
//   });
  
//   const [selectedImages, setSelectedImages] = useState([]);
  
//   const [confirmModal, setConfirmModal] = useState({
//     isOpen: false,
//     message: '',
//     businessToDelete: null,
//     businessName: ''
//   });

//   const navigate = useNavigate();

//   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
//   const [selectedService, setSelectedService] = useState('All Services');
  
//   const serviceFilterOptions = ['All Services', 'Wedding', 'Reception', 'Birthday', 'Anniversary', 'Corporate Event'];

//   const toggleServiceDropdown = () => {
//     setIsServiceDropdownOpen(!isServiceDropdownOpen);
//   };

//   const handleServiceSelect = (value) => {
//     setSelectedService(value);
//     setIsServiceDropdownOpen(false);
//   };

//   useEffect(() => {
//     loadVendorsAndPayments();
//   }, []);

//   const loadVendorsAndPayments = async () => {
//     try {
//       setIsLoadingList(true);
//       setErrorList(null);
      
//       // Fetch both businesses and payments
//       const [businessesData, paymentsData] = await Promise.all([
//         getAllBusinessPartners(),
//         getAllPaymentsWithUsers()
//       ]);
      
//       // Create a map of userId -> payment
//       const paymentsByUser = {};
//       (paymentsData || []).forEach(payment => {
//         if (payment.user && payment.user.businessPartnerId) {
//           paymentsByUser[payment.user.businessPartnerId] = payment;
//         }
//       });
      
//       setPaymentsMap(paymentsByUser);
      
//       // Filter businesses based on approval and expiry
//       const activeBusinesses = (businessesData || []).filter(business => {
//         if (!business.isApproved) return false;
        
//         const payment = paymentsByUser[business.id];
        
//         // If no payment found, don't show
//         if (!payment) return false;
        
//         // Only show successful/completed payments
//         if (payment.status !== 'success' && payment.status !== 'completed' && payment.status !== 'paid') {
//           return false;
//         }
        
//         // Check if subscription is expired
//         if (payment.expiredAt) {
//           const expiryDate = new Date(payment.expiredAt);
//           const now = new Date();
//           if (expiryDate < now) {
//             return false; // Hide expired businesses
//           }
//         }
        
//         return true;
//       });
      
//       setAllBusinesses(activeBusinesses);
//       setFilteredBusinesses(activeBusinesses);
//     } catch (err) {
//       setErrorList(err);
//       console.error("Failed to fetch business partners list:", err);
//       setAllBusinesses([]);
//       setFilteredBusinesses([]);
//     } finally {
//       setIsLoadingList(false);
//     }
//   };

//   useEffect(() => {
//     let businessesToFilter = allBusinesses;

//     if (selectedService !== 'All Services') {
//       businessesToFilter = businessesToFilter.filter(
//         business => business.serviceProvided === selectedService
//       );
//     }

//     if (searchTerm) {
//       businessesToFilter = businessesToFilter.filter(business =>
//         business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         business.id?.toString().includes(searchTerm)
//       );
//     }

//     setFilteredBusinesses(businessesToFilter);
//   }, [selectedService, searchTerm, allBusinesses]);

//   // Helper function to format plan type
//   const formatPlanType = (planType) => {
//     if (!planType) return 'No Plan';
//     return planType.replace('_', ' ');
//   };

//   // Helper function to format date
//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-IN', { 
//       year: 'numeric', 
//       month: 'short', 
//       day: 'numeric' 
//     });
//   };

//   // Helper function to check if subscription is about to expire (within 7 days)
//   const isExpiringSoon = (expiryDate) => {
//     if (!expiryDate) return false;
//     const expiry = new Date(expiryDate);
//     const now = new Date();
//     const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
//     return daysLeft > 0 && daysLeft <= 7;
//   };

//   // Helper function to get subscription status
//   const getSubscriptionStatus = (payment) => {
//     if (!payment) return { text: 'No Plan', class: 'inactive' };
    
//     if (payment.status !== 'success' && payment.status !== 'completed' && payment.status !== 'paid') {
//       return { text: 'Pending', class: 'pending' };
//     }
    
//     if (payment.expiredAt) {
//       const expiryDate = new Date(payment.expiredAt);
//       const now = new Date();
      
//       if (expiryDate < now) {
//         return { text: 'Expired', class: 'expired' };
//       }
      
//       if (isExpiringSoon(payment.expiredAt)) {
//         return { text: 'Expiring Soon', class: 'expiring' };
//       }
//     }
    
//     return { text: 'Active', class: 'active' };
//   };

//   const showDeleteConfirmation = (businessId, businessName) => {
//     setConfirmModal({
//       isOpen: true,
//       message: `Are you sure you want to delete "${businessName}"? This action cannot be undone.`,
//       businessToDelete: businessId,
//       businessName: businessName
//     });
//   };

//   const handleDeleteBusiness = async () => {
//     const businessId = confirmModal.businessToDelete;
//     setConfirmModal({ ...confirmModal, isOpen: false });
//     setDeletingId(businessId);
//     setErrorList(null);

//     try {
//       await deleteBusinessPartner(businessId);
      
//       setAllBusinesses(prevBusinesses => 
//         prevBusinesses.filter(business => business.id !== businessId)
//       );
//       setFilteredBusinesses(prevBusinesses => 
//         prevBusinesses.filter(business => business.id !== businessId)
//       );
//     } catch (err) {
//       console.error(`Failed to delete business ${businessId}:`, err);
//       setErrorList(err);
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const openAddBusinessModal = () => {
//     setIsAddBusinessModalOpen(true);
//     setCurrentStep(1);
//     setCreatedUserId(null);
//     setModalError('');
//     setModalSuccess('');
//     setUserFormData({
//       phoneNumber: '',
//       name: '',
//       isAdmin: false
//     });
//     setBusinessFormData({
//       proprietorName: '',
//       businessName: '',
//       pincode: '',
//       phoneNumber: '',
//       email: '',
//       serviceProvided: '',
//       location: '',
//       state: '',
//       district: '',
//       price: '',
//       aproxLatitude: '',
//       aproxLongitude: '',
//       isApproved: true,
//       moreDetails: '',
//       subCategories: ''
//     });
//     setSelectedImages([]);
//   };

//   const closeAddBusinessModal = () => {
//     setIsAddBusinessModalOpen(false);
//     setCurrentStep(1);
//     setCreatedUserId(null);
//     setModalError('');
//     setModalSuccess('');
//   };

//   const handleUserInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setUserFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleBusinessInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setBusinessFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleImageSelect = (e) => {
//     const files = Array.from(e.target.files);
//     setSelectedImages(files);
//   };

//   const handleCreateUser = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setModalError('');
//     setModalSuccess('');

//     try {
//       const userData = {
//         phoneNumber: userFormData.phoneNumber,
//         name: userFormData.name,
//         isAdmin: userFormData.isAdmin
//       };

//       console.log('Attempting to create user:', userData);
//       const response = await createUserByAdmin(userData);
//       console.log('User creation response:', response);
      
//       setCreatedUserId(response.id || response.userId);
//       setModalSuccess('User created successfully! Now add business details.');
      
//       setBusinessFormData(prev => ({
//         ...prev,
//         phoneNumber: userFormData.phoneNumber,
//         proprietorName: userFormData.name
//       }));
      
//       setTimeout(() => {
//         setCurrentStep(2);
//         setModalSuccess('');
//       }, 1000);
//     } catch (error) {
//       console.error('Error creating user:', error);
      
//       let errorMessage = 'Failed to create user. Please try again.';
      
//       if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
//         errorMessage = 'A user with this phone number already exists. Please use a different number.';
//       } else if (error.message?.includes('502')) {
//         errorMessage = 'Server error (502). Please try again later.';
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       setModalError(errorMessage);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCreateBusiness = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setModalError('');
//     setModalSuccess('');

//     try {
//       const formData = new FormData();
      
//       Object.keys(businessFormData).forEach(key => {
//         if (businessFormData[key]) {
//           formData.append(key, businessFormData[key]);
//         }
//       });

//       selectedImages.forEach(image => {
//         formData.append('images', image);
//       });

//       console.log('Creating business with form data');
//       const response = await createBusinessPartner(formData);
//       console.log('Business created successfully:', response);
      
//       setModalSuccess('Business created successfully! Reloading vendors...');
      
//       await loadVendorsAndPayments();
      
//       setTimeout(() => {
//         closeAddBusinessModal();
//       }, 2000);
//     } catch (error) {
//       console.error('Error creating business:', error);
      
//       let errorMessage = 'Failed to create business. Please try again.';
      
//       if (error.message?.includes('502')) {
//         errorMessage = 'Server error (502). Please check if the backend is running.';
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       setModalError(errorMessage);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const approvedVendorCount = allBusinesses.length;

//   return (
//     <div className={`business-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//       <PageHeader title="Business Management" showBreadcrumb={true} />

//       <div className="business-management-actions">
//         <div className="search-bar">
//           <input 
//             type="text" 
//             placeholder="Search" 
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <span className="search-icon">🔍</span>
//         </div>
//         <div className="header-right-actions">
//           <div className="total-vendors">
//             Total Vendors : {isLoadingList ? '...' : approvedVendorCount}
//           </div>
//           <button className="add-business-btn" onClick={openAddBusinessModal}>
//             <FaPlus /> Add Business
//           </button>
//         </div>
//       </div>

//       {isLoadingList && <p className="loading-message">Loading vendors list...</p>}
//       {errorList && (
//         <p className="error-message">
//           Error: {typeof errorList === 'string' ? errorList : errorList.message || 'Unknown error'}
//         </p>
//       )}

//       <div className="business-table-container">
//         <table className="business-table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>
//                 <div className="catering-dropdown">
//                   <div className="catering-dropdown-header" onClick={toggleServiceDropdown}>
//                     Services <span className="catering-dropdown-arrow">▼</span>
//                   </div>
//                   {isServiceDropdownOpen && (
//                     <ul className="catering-dropdown-options">
//                       {serviceFilterOptions.map((option) => (
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
//               <th>Subscription</th>
//               <th>Status</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {!isLoadingList && !errorList && filteredBusinesses.length > 0 ? (
//               filteredBusinesses.map((business) => {
//                 const payment = paymentsMap[business.id];
//                 const subscriptionStatus = getSubscriptionStatus(payment);
//                 const isDeleting = deletingId === business.id;
                
//                 return (
//                   <tr key={business.id}>
//                     <td>{business.businessName}</td>
//                     <td>{business.serviceProvided || 'Catering'}</td>
//                     <td>{business.phoneNumber}</td>
//                     <td>
//                       <div className="subscription-info">
//                         <div className="plan-type">
//                           {payment ? formatPlanType(payment.planType) : 'No Plan'}
//                         </div>
//                         {payment && payment.createdAt && (
//                           <div className="subscription-dates">
//                             <div className="date-item">
//                               <FaCalendarAlt className="date-icon" />
//                               <span className="date-label">Start:</span>
//                               <span className="date-value">{formatDate(payment.createdAt)}</span>
//                             </div>
//                             {payment.expiredAt && (
//                               <div className="date-item">
//                                 <FaCalendarAlt className="date-icon" />
//                                 <span className="date-label">End:</span>
//                                 <span className="date-value">{formatDate(payment.expiredAt)}</span>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                     <td>
//                       <span className={`status-badge ${subscriptionStatus.class}`}>
//                         {subscriptionStatus.text}
//                       </span>
//                     </td>
//                     <td>
//                       <div className="action-buttons">
//                         <Link 
//                           to={`/business-profile/${business.id}`} 
//                           className="view-profile-link"
//                         >
//                           view profile
//                         </Link>
//                         <button
//                           onClick={() => showDeleteConfirmation(business.id, business.businessName)}
//                           className="delete-business-button"
//                           disabled={isDeleting}
//                           title="Delete Business"
//                         >
//                           {isDeleting ? (
//                             <FaSpinner className="spinner-icon" />
//                           ) : (
//                             <FaTrash />
//                           )}
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
//             ) : !isLoadingList && !errorList && filteredBusinesses.length === 0 ? (
//               <tr>
//                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
//                   {searchTerm ? 'No vendors found matching your search.' : 'No active vendors found.'}
//                 </td>
//               </tr>
//             ) : null}
//           </tbody>
//         </table>
//       </div>

//       {/* Modal code remains the same as before */}
//       {isAddBusinessModalOpen && (
//         <div className="add-business-modal-overlay" onClick={closeAddBusinessModal}>
//           <div className="add-business-modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="add-business-modal-header">
//               <h2>{currentStep === 1 ? 'Step 1: Create User' : 'Step 2: Add Business Details'}</h2>
//               <button className="add-business-modal-close" onClick={closeAddBusinessModal}>×</button>
//             </div>

//             <div className="add-business-modal-body">
//               {modalError && (
//                 <div className="modal-error-message">
//                   <strong>Error:</strong> {modalError}
//                   <br />
//                   <small>Check browser console (F12) for more details</small>
//                 </div>
//               )}
//               {modalSuccess && <div className="modal-success-message">{modalSuccess}</div>}

//               {currentStep === 1 && (
//                 <form onSubmit={handleCreateUser} className="add-business-form">
//                   <div className="form-step-indicator">
//                     <div className="step-indicator active">1</div>
//                     <div className="step-line"></div>
//                     <div className="step-indicator">2</div>
//                   </div>

//                   <div className="form-group">
//                     <label>Phone Number*</label>
//                     <input
//                       type="tel"
//                       name="phoneNumber"
//                       value={userFormData.phoneNumber}
//                       onChange={handleUserInputChange}
//                       placeholder="+919876543210"
//                       required
//                     />
//                   </div>

//                   <div className="form-group">
//                     <label>Name*</label>
//                     <input
//                       type="text"
//                       name="name"
//                       value={userFormData.name}
//                       onChange={handleUserInputChange}
//                       placeholder="John Doe"
//                       required
//                     />
//                   </div>

//                   <div className="form-group-checkbox">
//                     <label>
//                       <input
//                         type="checkbox"
//                         name="isAdmin"
//                         checked={userFormData.isAdmin}
//                         onChange={handleUserInputChange}
//                       />
//                       <span>Is Admin</span>
//                     </label>
//                   </div>

//                   <div className="form-actions">
//                     <button type="button" onClick={closeAddBusinessModal} className="btn-cancel">
//                       Cancel
//                     </button>
//                     <button type="submit" className="btn-submit" disabled={isSubmitting}>
//                       {isSubmitting ? (
//                         <>
//                           <FaSpinner className="spinner" /> Creating...
//                         </>
//                       ) : (
//                         'Create User & Continue'
//                       )}
//                     </button>
//                   </div>
//                 </form>
//               )}

//               {currentStep === 2 && (
//                 <form onSubmit={handleCreateBusiness} className="add-business-form">
//                   <div className="form-step-indicator">
//                     <div className="step-indicator completed">✓</div>
//                     <div className="step-line completed"></div>
//                     <div className="step-indicator active">2</div>
//                   </div>

//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>Business Name*</label>
//                       <input
//                         type="text"
//                         name="businessName"
//                         value={businessFormData.businessName}
//                         onChange={handleBusinessInputChange}
//                         placeholder="My Business"
//                         required
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>Proprietor Name*</label>
//                       <input
//                         type="text"
//                         name="proprietorName"
//                         value={businessFormData.proprietorName}
//                         onChange={handleBusinessInputChange}
//                         placeholder="John Doe"
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>Phone Number*</label>
//                       <input
//                         type="tel"
//                         name="phoneNumber"
//                         value={businessFormData.phoneNumber}
//                         onChange={handleBusinessInputChange}
//                         placeholder="+919876543210"
//                         required
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>Email*</label>
//                       <input
//                         type="email"
//                         name="email"
//                         value={businessFormData.email}
//                         onChange={handleBusinessInputChange}
//                         placeholder="john@example.com"
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>Service Provided*</label>
//                       <select
//                         name="serviceProvided"
//                         value={businessFormData.serviceProvided}
//                         onChange={handleBusinessInputChange}
//                         required
//                       >
//                         <option value="">Select Service</option>
//                         <option value="Wedding">Wedding</option>
//                         <option value="Reception">Reception</option>
//                         <option value="Birthday">Birthday</option>
//                         <option value="Anniversary">Anniversary</option>
//                         <option value="Corporate Event">Corporate Event</option>
//                       </select>
//                     </div>

//                     <div className="form-group">
//                       <label>Price</label>
//                       <input
//                         type="number"
//                         name="price"
//                         value={businessFormData.price}
//                         onChange={handleBusinessInputChange}
//                         placeholder="1000"
//                       />
//                     </div>
//                   </div>

//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>Location</label>
//                       <input
//                         type="text"
//                         name="location"
//                         value={businessFormData.location}
//                         onChange={handleBusinessInputChange}
//                         placeholder="City"
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>State</label>
//                       <input
//                         type="text"
//                         name="state"
//                         value={businessFormData.state}
//                         onChange={handleBusinessInputChange}
//                         placeholder="State"
//                       />
//                     </div>
//                   </div>

//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>District</label>
//                       <input
//                         type="text"
//                         name="district"
//                         value={businessFormData.district}
//                         onChange={handleBusinessInputChange}
//                         placeholder="District"
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>Pincode*</label>
//                       <input
//                         type="text"
//                         name="pincode"
//                         value={businessFormData.pincode}
//                         onChange={handleBusinessInputChange}
//                         placeholder="12345"
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>Latitude</label>
//                       <input
//                         type="text"
//                         name="aproxLatitude"
//                         value={businessFormData.aproxLatitude}
//                         onChange={handleBusinessInputChange}
//                         placeholder="12.9716"
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>Longitude</label>
//                       <input
//                         type="text"
//                         name="aproxLongitude"
//                         value={businessFormData.aproxLongitude}
//                         onChange={handleBusinessInputChange}
//                         placeholder="77.5946"
//                       />
//                     </div>
//                   </div>

//                   <div className="form-group">
//                     <label>Sub Categories (comma separated)</label>
//                     <input
//                       type="text"
//                       name="subCategories"
//                       value={businessFormData.subCategories}
//                       onChange={handleBusinessInputChange}
//                       placeholder="Category1, Category2"
//                     />
//                   </div>

//                   <div className="form-group">
//                     <label>More Details (JSON format)</label>
//                     <textarea
//                       name="moreDetails"
//                       value={businessFormData.moreDetails}
//                       onChange={handleBusinessInputChange}
//                       placeholder='[{"name":"Detail1","detail":"Value1"}]'
//                       rows="3"
//                     />
//                   </div>

//                   <div className="form-group">
//                     <label>Business Images</label>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       multiple
//                       onChange={handleImageSelect}
//                       className="file-input"
//                     />
//                     {selectedImages.length > 0 && (
//                       <p className="file-count">{selectedImages.length} image(s) selected</p>
//                     )}
//                   </div>

//                   <div className="form-group-checkbox">
//                     <label>
//                       <input
//                         type="checkbox"
//                         name="isApproved"
//                         checked={businessFormData.isApproved}
//                         onChange={handleBusinessInputChange}
//                       />
//                       <span>Approve Business</span>
//                     </label>
//                   </div>

//                   <div className="form-actions">
//                     <button type="button" onClick={() => setCurrentStep(1)} className="btn-back">
//                       Back
//                     </button>
//                     <button type="submit" className="btn-submit" disabled={isSubmitting}>
//                       {isSubmitting ? (
//                         <>
//                           <FaSpinner className="spinner" /> Creating...
//                         </>
//                       ) : (
//                         'Create Business'
//                       )}
//                     </button>
//                   </div>
//                 </form>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <ConfirmModal
//         isOpen={confirmModal.isOpen}
//         message={confirmModal.message}
//         onConfirm={handleDeleteBusiness}
//         onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
//       />
//     </div>
//   );
// }

// export default BusinessManagement;

// // import { useState, useEffect } from 'react';
// // import PageHeader from '../components/PageHeader';
// // import '../styles/BusinessManagement.css';
// // import { 
// //   getAllBusinessPartners, 
// //   deleteBusinessPartner,
// //   createUserByAdmin,
// //   createBusinessPartner
// // } from '../services/apiService';
// // import { Link, useNavigate } from 'react-router-dom';
// // import { FaTrash, FaSpinner, FaPlus } from 'react-icons/fa';
// // import ConfirmModal from '../components/ConfirmModal';

// // function BusinessManagement({ isSidebarOpen }) {
// //   const [allBusinesses, setAllBusinesses] = useState([]);
// //   const [filteredBusinesses, setFilteredBusinesses] = useState([]);
// //   const [isLoadingList, setIsLoadingList] = useState(true);
// //   const [errorList, setErrorList] = useState(null);
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [deletingId, setDeletingId] = useState(null);
  
// //   // Add Business Modal States
// //   const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
// //   const [currentStep, setCurrentStep] = useState(1);
// //   const [createdUserId, setCreatedUserId] = useState(null);
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [modalError, setModalError] = useState('');
// //   const [modalSuccess, setModalSuccess] = useState('');
  
// //   // User Form Data
// //   const [userFormData, setUserFormData] = useState({
// //     phoneNumber: '',
// //     name: '',
// //     isAdmin: false
// //   });
  
// //   // Business Form Data
// //   const [businessFormData, setBusinessFormData] = useState({
// //     proprietorName: '',
// //     businessName: '',
// //     pincode: '',
// //     phoneNumber: '',
// //     email: '',
// //     serviceProvided: '',
// //     location: '',
// //     state: '',
// //     district: '',
// //     price: '',
// //     aproxLatitude: '',
// //     aproxLongitude: '',
// //     isApproved: true,
// //     moreDetails: '',
// //     subCategories: ''
// //   });
  
// //   const [selectedImages, setSelectedImages] = useState([]);
  
// //   const [confirmModal, setConfirmModal] = useState({
// //     isOpen: false,
// //     message: '',
// //     businessToDelete: null,
// //     businessName: ''
// //   });

// //   const navigate = useNavigate();

// //   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
// //   const [selectedService, setSelectedService] = useState('All Services');
  
// //   const serviceFilterOptions = ['All Services', 'Wedding', 'Reception', 'Birthday', 'Anniversary', 'Corporate Event'];

// //   const toggleServiceDropdown = () => {
// //     setIsServiceDropdownOpen(!isServiceDropdownOpen);
// //   };

// //   const handleServiceSelect = (value) => {
// //     setSelectedService(value);
// //     setIsServiceDropdownOpen(false);
// //   };

// //   useEffect(() => {
// //     loadVendors();
// //   }, []);

// //   const loadVendors = async () => {
// //     try {
// //       setIsLoadingList(true);
// //       setErrorList(null);
// //       const data = await getAllBusinessPartners();
// //       setAllBusinesses((data || []).filter(business => business.isApproved));
// //       setFilteredBusinesses((data || []).filter(business => business.isApproved));
// //     } catch (err) {
// //       setErrorList(err);
// //       console.error("Failed to fetch business partners list:", err);
// //       setAllBusinesses([]);
// //       setFilteredBusinesses([]);
// //     } finally {
// //       setIsLoadingList(false);
// //     }
// //   };

// //   useEffect(() => {
// //     let businessesToFilter = allBusinesses;

// //     if (selectedService !== 'All Services') {
// //       businessesToFilter = businessesToFilter.filter(
// //         business => business.serviceProvided === selectedService
// //       );
// //     }

// //     if (searchTerm) {
// //       businessesToFilter = businessesToFilter.filter(business =>
// //         business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //         business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //         business.id?.toString().includes(searchTerm)
// //       );
// //     }

// //     setFilteredBusinesses(businessesToFilter);
// //   }, [selectedService, searchTerm, allBusinesses]);

// //   const showDeleteConfirmation = (businessId, businessName) => {
// //     setConfirmModal({
// //       isOpen: true,
// //       message: `Are you sure you want to delete "${businessName}"? This action cannot be undone.`,
// //       businessToDelete: businessId,
// //       businessName: businessName
// //     });
// //   };

// //   const handleDeleteBusiness = async () => {
// //     const businessId = confirmModal.businessToDelete;
// //     setConfirmModal({ ...confirmModal, isOpen: false });
// //     setDeletingId(businessId);
// //     setErrorList(null);

// //     try {
// //       await deleteBusinessPartner(businessId);
      
// //       setAllBusinesses(prevBusinesses => 
// //         prevBusinesses.filter(business => business.id !== businessId)
// //       );
// //       setFilteredBusinesses(prevBusinesses => 
// //         prevBusinesses.filter(business => business.id !== businessId)
// //       );
// //     } catch (err) {
// //       console.error(`Failed to delete business ${businessId}:`, err);
// //       setErrorList(err);
// //     } finally {
// //       setDeletingId(null);
// //     }
// //   };

// //   const openAddBusinessModal = () => {
// //     setIsAddBusinessModalOpen(true);
// //     setCurrentStep(1);
// //     setCreatedUserId(null);
// //     setModalError('');
// //     setModalSuccess('');
// //     setUserFormData({
// //       phoneNumber: '',
// //       name: '',
// //       isAdmin: false
// //     });
// //     setBusinessFormData({
// //       proprietorName: '',
// //       businessName: '',
// //       pincode: '',
// //       phoneNumber: '',
// //       email: '',
// //       serviceProvided: '',
// //       location: '',
// //       state: '',
// //       district: '',
// //       price: '',
// //       aproxLatitude: '',
// //       aproxLongitude: '',
// //       isApproved: true,
// //       moreDetails: '',
// //       subCategories: ''
// //     });
// //     setSelectedImages([]);
// //   };

// //   const closeAddBusinessModal = () => {
// //     setIsAddBusinessModalOpen(false);
// //     setCurrentStep(1);
// //     setCreatedUserId(null);
// //     setModalError('');
// //     setModalSuccess('');
// //   };

// //   const handleUserInputChange = (e) => {
// //     const { name, value, type, checked } = e.target;
// //     setUserFormData(prev => ({
// //       ...prev,
// //       [name]: type === 'checkbox' ? checked : value
// //     }));
// //   };

// //   const handleBusinessInputChange = (e) => {
// //     const { name, value, type, checked } = e.target;
// //     setBusinessFormData(prev => ({
// //       ...prev,
// //       [name]: type === 'checkbox' ? checked : value
// //     }));
// //   };

// //   const handleImageSelect = (e) => {
// //     const files = Array.from(e.target.files);
// //     setSelectedImages(files);
// //   };

// //   // Step 1: Create User with improved error handling
// //   const handleCreateUser = async (e) => {
// //     e.preventDefault();
// //     setIsSubmitting(true);
// //     setModalError('');
// //     setModalSuccess('');

// //     try {
// //       const userData = {
// //         phoneNumber: userFormData.phoneNumber,
// //         name: userFormData.name,
// //         isAdmin: userFormData.isAdmin
// //       };

// //       console.log('Attempting to create user:', userData);
// //       const response = await createUserByAdmin(userData);
// //       console.log('User creation response:', response);
      
// //       setCreatedUserId(response.id || response.userId);
// //       setModalSuccess('User created successfully! Now add business details.');
      
// //       setBusinessFormData(prev => ({
// //         ...prev,
// //         phoneNumber: userFormData.phoneNumber,
// //         proprietorName: userFormData.name
// //       }));
      
// //       setTimeout(() => {
// //         setCurrentStep(2);
// //         setModalSuccess('');
// //       }, 1000);
// //     } catch (error) {
// //       console.error('Error creating user:', error);
      
// //       let errorMessage = 'Failed to create user. Please try again.';
      
// //       if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
// //         errorMessage = 'A user with this phone number already exists. Please use a different number or skip to business creation.';
// //       } else if (error.message?.includes('502') || error.message?.includes('Bad Gateway')) {
// //         errorMessage = 'Server error (502). Please check if the backend is running or try again later.';
// //       } else if (error.message?.includes('CORS') || error.message?.includes('Cross-Origin')) {
// //         errorMessage = 'Network error (CORS). Please contact the administrator.';
// //       } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
// //         errorMessage = 'Authentication error. Please login again.';
// //       } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
// //         errorMessage = 'Permission denied. You do not have access to create users.';
// //       } else if (error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION')) {
// //         errorMessage = 'Cannot connect to server. Please check your internet connection.';
// //       } else if (error.message) {
// //         errorMessage = error.message;
// //       }
      
// //       setModalError(errorMessage);
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   // Step 2: Add Business with improved error handling
// //   const handleCreateBusiness = async (e) => {
// //     e.preventDefault();
// //     setIsSubmitting(true);
// //     setModalError('');
// //     setModalSuccess('');

// //     try {
// //       const formData = new FormData();
      
// //       Object.keys(businessFormData).forEach(key => {
// //         if (businessFormData[key]) {
// //           formData.append(key, businessFormData[key]);
// //         }
// //       });

// //       selectedImages.forEach(image => {
// //         formData.append('images', image);
// //       });

// //       console.log('Creating business with form data');
// //       const response = await createBusinessPartner(formData);
// //       console.log('Business created successfully:', response);
      
// //       setModalSuccess('Business created successfully! Reloading vendors...');
      
// //       await loadVendors();
      
// //       setTimeout(() => {
// //         closeAddBusinessModal();
// //       }, 2000);
// //     } catch (error) {
// //       console.error('Error creating business:', error);
      
// //       let errorMessage = 'Failed to create business. Please try again.';
      
// //       if (error.message?.includes('502') || error.message?.includes('Bad Gateway')) {
// //         errorMessage = 'Server error (502). Please check if the backend is running.';
// //       } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
// //         errorMessage = 'Authentication error. Please login again.';
// //       } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
// //         errorMessage = 'Permission denied. You do not have access to create businesses.';
// //       } else if (error.message?.includes('Network Error')) {
// //         errorMessage = 'Cannot connect to server. Please check your internet connection.';
// //       } else if (error.message) {
// //         errorMessage = error.message;
// //       }
      
// //       setModalError(errorMessage);
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   const approvedVendorCount = allBusinesses.length;

// //   return (
// //     <div className={`business-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// //       <PageHeader title="Business Management" showBreadcrumb={true} />

// //       <div className="business-management-actions">
// //         <div className="search-bar">
// //           <input 
// //             type="text" 
// //             placeholder="Search" 
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //           />
// //           <span className="search-icon">🔍</span>
// //         </div>
// //         <div className="header-right-actions">
// //           <div className="total-vendors">
// //             Total Vendors : {isLoadingList ? '...' : approvedVendorCount}
// //           </div>
// //           <button className="add-business-btn" onClick={openAddBusinessModal}>
// //             <FaPlus /> Add Business
// //           </button>
// //         </div>
// //       </div>

// //       {isLoadingList && <p className="loading-message">Loading vendors list...</p>}
// //       {errorList && (
// //         <p className="error-message">
// //           Error: {typeof errorList === 'string' ? errorList : errorList.message || 'Unknown error'}
// //         </p>
// //       )}

// //       <div className="business-table-container">
// //         <table className="business-table">
// //           <thead>
// //             <tr>
// //               <th>Name</th>
// //               <th>
// //                 <div className="catering-dropdown">
// //                   <div className="catering-dropdown-header" onClick={toggleServiceDropdown}>
// //                     Services <span className="catering-dropdown-arrow">▼</span>
// //                   </div>
// //                   {isServiceDropdownOpen && (
// //                     <ul className="catering-dropdown-options">
// //                       {serviceFilterOptions.map((option) => (
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
// //               <th>Subscription</th>
// //               <th>Status</th>
// //               <th>Actions</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {!isLoadingList && !errorList && filteredBusinesses.length > 0 ? (
// //               filteredBusinesses.map((business) => {
// //                 const isActive = business.isApproved;
// //                 const isDeleting = deletingId === business.id;
                
// //                 return (
// //                   <tr key={business.id}>
// //                     <td>{business.businessName}</td>
// //                     <td>{business.serviceProvided || 'Catering'}</td>
// //                     <td>{business.phoneNumber}</td>
// //                     <td>3 Months</td>
// //                     <td>
// //                       <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
// //                         {isActive ? 'Active' : 'Inactive'}
// //                       </span>
// //                     </td>
// //                     <td>
// //                       <div className="action-buttons">
// //                         <Link 
// //                           to={`/business-profile/${business.id}`} 
// //                           className="view-profile-link"
// //                         >
// //                           view profile
// //                         </Link>
// //                         <button
// //                           onClick={() => showDeleteConfirmation(business.id, business.businessName)}
// //                           className="delete-business-button"
// //                           disabled={isDeleting}
// //                           title="Delete Business"
// //                         >
// //                           {isDeleting ? (
// //                             <FaSpinner className="spinner-icon" />
// //                           ) : (
// //                             <FaTrash />
// //                           )}
// //                         </button>
// //                       </div>
// //                     </td>
// //                   </tr>
// //                 );
// //               })
// //             ) : !isLoadingList && !errorList && filteredBusinesses.length === 0 ? (
// //               <tr>
// //                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
// //                   {searchTerm ? 'No vendors found matching your search.' : 'No vendors found.'}
// //                 </td>
// //               </tr>
// //             ) : null}
// //           </tbody>
// //         </table>
// //       </div>

// //       {isAddBusinessModalOpen && (
// //         <div className="add-business-modal-overlay" onClick={closeAddBusinessModal}>
// //           <div className="add-business-modal-content" onClick={(e) => e.stopPropagation()}>
// //             <div className="add-business-modal-header">
// //               <h2>{currentStep === 1 ? 'Step 1: Create User' : 'Step 2: Add Business Details'}</h2>
// //               <button className="add-business-modal-close" onClick={closeAddBusinessModal}>×</button>
// //             </div>

// //             <div className="add-business-modal-body">
// //               {modalError && (
// //                 <div className="modal-error-message">
// //                   <strong>Error:</strong> {modalError}
// //                   <br />
// //                   <small>Check browser console (F12) for more details</small>
// //                 </div>
// //               )}
// //               {modalSuccess && <div className="modal-success-message">{modalSuccess}</div>}

// //               {currentStep === 1 && (
// //                 <form onSubmit={handleCreateUser} className="add-business-form">
// //                   <div className="form-step-indicator">
// //                     <div className="step-indicator active">1</div>
// //                     <div className="step-line"></div>
// //                     <div className="step-indicator">2</div>
// //                   </div>

// //                   <div className="form-group">
// //                     <label>Phone Number*</label>
// //                     <input
// //                       type="tel"
// //                       name="phoneNumber"
// //                       value={userFormData.phoneNumber}
// //                       onChange={handleUserInputChange}
// //                       placeholder="+919876543210"
// //                       required
// //                     />
// //                   </div>

// //                   <div className="form-group">
// //                     <label>Name*</label>
// //                     <input
// //                       type="text"
// //                       name="name"
// //                       value={userFormData.name}
// //                       onChange={handleUserInputChange}
// //                       placeholder="John Doe"
// //                       required
// //                     />
// //                   </div>

// //                   <div className="form-group-checkbox">
// //                     <label>
// //                       <input
// //                         type="checkbox"
// //                         name="isAdmin"
// //                         checked={userFormData.isAdmin}
// //                         onChange={handleUserInputChange}
// //                       />
// //                       <span>Is Admin</span>
// //                     </label>
// //                   </div>

// //                   <div className="form-actions">
// //                     <button type="button" onClick={closeAddBusinessModal} className="btn-cancel">
// //                       Cancel
// //                     </button>
// //                     <button type="submit" className="btn-submit" disabled={isSubmitting}>
// //                       {isSubmitting ? (
// //                         <>
// //                           <FaSpinner className="spinner" /> Creating...
// //                         </>
// //                       ) : (
// //                         'Create User & Continue'
// //                       )}
// //                     </button>
// //                   </div>
// //                 </form>
// //               )}

// //               {currentStep === 2 && (
// //                 <form onSubmit={handleCreateBusiness} className="add-business-form">
// //                   <div className="form-step-indicator">
// //                     <div className="step-indicator completed">✓</div>
// //                     <div className="step-line completed"></div>
// //                     <div className="step-indicator active">2</div>
// //                   </div>

// //                   <div className="form-row">
// //                     <div className="form-group">
// //                       <label>Business Name*</label>
// //                       <input
// //                         type="text"
// //                         name="businessName"
// //                         value={businessFormData.businessName}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="My Business"
// //                         required
// //                       />
// //                     </div>

// //                     <div className="form-group">
// //                       <label>Proprietor Name*</label>
// //                       <input
// //                         type="text"
// //                         name="proprietorName"
// //                         value={businessFormData.proprietorName}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="John Doe"
// //                         required
// //                       />
// //                     </div>
// //                   </div>

// //                   <div className="form-row">
// //                     <div className="form-group">
// //                       <label>Phone Number*</label>
// //                       <input
// //                         type="tel"
// //                         name="phoneNumber"
// //                         value={businessFormData.phoneNumber}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="+919876543210"
// //                         required
// //                       />
// //                     </div>

// //                     <div className="form-group">
// //                       <label>Email*</label>
// //                       <input
// //                         type="email"
// //                         name="email"
// //                         value={businessFormData.email}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="john@example.com"
// //                         required
// //                       />
// //                     </div>
// //                   </div>

// //                   <div className="form-row">
// //                     <div className="form-group">
// //                       <label>Service Provided*</label>
// //                       <select
// //                         name="serviceProvided"
// //                         value={businessFormData.serviceProvided}
// //                         onChange={handleBusinessInputChange}
// //                         required
// //                       >
// //                         <option value="">Select Service</option>
// //                         <option value="Wedding">Wedding</option>
// //                         <option value="Reception">Reception</option>
// //                         <option value="Birthday">Birthday</option>
// //                         <option value="Anniversary">Anniversary</option>
// //                         <option value="Corporate Event">Corporate Event</option>
// //                       </select>
// //                     </div>

// //                     <div className="form-group">
// //                       <label>Price</label>
// //                       <input
// //                         type="number"
// //                         name="price"
// //                         value={businessFormData.price}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="1000"
// //                       />
// //                     </div>
// //                   </div>

// //                   <div className="form-row">
// //                     <div className="form-group">
// //                       <label>Location</label>
// //                       <input
// //                         type="text"
// //                         name="location"
// //                         value={businessFormData.location}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="City"
// //                       />
// //                     </div>

// //                     <div className="form-group">
// //                       <label>State</label>
// //                       <input
// //                         type="text"
// //                         name="state"
// //                         value={businessFormData.state}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="State"
// //                       />
// //                     </div>
// //                   </div>

// //                   <div className="form-row">
// //                     <div className="form-group">
// //                       <label>District</label>
// //                       <input
// //                         type="text"
// //                         name="district"
// //                         value={businessFormData.district}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="District"
// //                       />
// //                     </div>

// //                     <div className="form-group">
// //                       <label>Pincode*</label>
// //                       <input
// //                         type="text"
// //                         name="pincode"
// //                         value={businessFormData.pincode}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="12345"
// //                         required
// //                       />
// //                     </div>
// //                   </div>

// //                   <div className="form-row">
// //                     <div className="form-group">
// //                       <label>Latitude</label>
// //                       <input
// //                         type="text"
// //                         name="aproxLatitude"
// //                         value={businessFormData.aproxLatitude}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="12.9716"
// //                       />
// //                     </div>

// //                     <div className="form-group">
// //                       <label>Longitude</label>
// //                       <input
// //                         type="text"
// //                         name="aproxLongitude"
// //                         value={businessFormData.aproxLongitude}
// //                         onChange={handleBusinessInputChange}
// //                         placeholder="77.5946"
// //                       />
// //                     </div>
// //                   </div>

// //                   <div className="form-group">
// //                     <label>Sub Categories (comma separated)</label>
// //                     <input
// //                       type="text"
// //                       name="subCategories"
// //                       value={businessFormData.subCategories}
// //                       onChange={handleBusinessInputChange}
// //                       placeholder="Category1, Category2"
// //                     />
// //                   </div>

// //                   <div className="form-group">
// //                     <label>More Details (JSON format)</label>
// //                     <textarea
// //                       name="moreDetails"
// //                       value={businessFormData.moreDetails}
// //                       onChange={handleBusinessInputChange}
// //                       placeholder='[{"name":"Detail1","detail":"Value1"}]'
// //                       rows="3"
// //                     />
// //                   </div>

// //                   <div className="form-group">
// //                     <label>Business Images</label>
// //                     <input
// //                       type="file"
// //                       accept="image/*"
// //                       multiple
// //                       onChange={handleImageSelect}
// //                       className="file-input"
// //                     />
// //                     {selectedImages.length > 0 && (
// //                       <p className="file-count">{selectedImages.length} image(s) selected</p>
// //                     )}
// //                   </div>

// //                   <div className="form-group-checkbox">
// //                     <label>
// //                       <input
// //                         type="checkbox"
// //                         name="isApproved"
// //                         checked={businessFormData.isApproved}
// //                         onChange={handleBusinessInputChange}
// //                       />
// //                       <span>Approve Business</span>
// //                     </label>
// //                   </div>

// //                   <div className="form-actions">
// //                     <button type="button" onClick={() => setCurrentStep(1)} className="btn-back">
// //                       Back
// //                     </button>
// //                     <button type="submit" className="btn-submit" disabled={isSubmitting}>
// //                       {isSubmitting ? (
// //                         <>
// //                           <FaSpinner className="spinner" /> Creating...
// //                         </>
// //                       ) : (
// //                         'Create Business'
// //                       )}
// //                     </button>
// //                   </div>
// //                 </form>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <ConfirmModal
// //         isOpen={confirmModal.isOpen}
// //         message={confirmModal.message}
// //         onConfirm={handleDeleteBusiness}
// //         onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
// //       />
// //     </div>
// //   );
// // }

// // export default BusinessManagement;

// // // import { useState, useEffect } from 'react';
// // // import PageHeader from '../components/PageHeader';
// // // import '../styles/BusinessManagement.css';
// // // import { getAllBusinessPartners, deleteBusinessPartner } from '../services/apiService';
// // // import { Link, useNavigate } from 'react-router-dom';
// // // import { FaTrash, FaSpinner } from 'react-icons/fa';
// // // import ConfirmModal from '../components/ConfirmModal';

// // // function BusinessManagement({ isSidebarOpen }) {
// // //   const [allBusinesses, setAllBusinesses] = useState([]);
// // //   const [filteredBusinesses, setFilteredBusinesses] = useState([]);
// // //   const [isLoadingList, setIsLoadingList] = useState(true);
// // //   const [errorList, setErrorList] = useState(null);
// // //   const [searchTerm, setSearchTerm] = useState('');
// // //   const [deletingId, setDeletingId] = useState(null);
  
// // //   const [confirmModal, setConfirmModal] = useState({
// // //     isOpen: false,
// // //     message: '',
// // //     businessToDelete: null,
// // //     businessName: ''
// // //   });

// // //   const navigate = useNavigate();

// // //   // State for the service type dropdown in the header
// // //   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
// // //   const [selectedService, setSelectedService] = useState('All Services');
  
// // //   // Options for the dropdown
// // //   const serviceFilterOptions = ['All Services', 'Wedding', 'Reception', 'Birthday', 'Anniversary', 'Corporate Event'];

// // //   // Toggle dropdown visibility
// // //   const toggleServiceDropdown = () => {
// // //     setIsServiceDropdownOpen(!isServiceDropdownOpen);
// // //   };

// // //   // Handle selection of a service option
// // //   const handleServiceSelect = (value) => {
// // //     setSelectedService(value);
// // //     setIsServiceDropdownOpen(false);
// // //   };

// // //   // Effect to fetch all business partners list
// // //   useEffect(() => {
// // //     loadVendors();
// // //   }, []);

// // //   const loadVendors = async () => {
// // //     try {
// // //       setIsLoadingList(true);
// // //       setErrorList(null);
// // //       const data = await getAllBusinessPartners();
// // //       setAllBusinesses((data || []).filter(business => business.isApproved));
// // //       setFilteredBusinesses((data || []).filter(business => business.isApproved));
// // //     } catch (err) {
// // //       setErrorList(err);
// // //       console.error("Failed to fetch business partners list:", err);
// // //       setAllBusinesses([]);
// // //       setFilteredBusinesses([]);
// // //     } finally {
// // //       setIsLoadingList(false);
// // //     }
// // //   };

// // //   // Effect to filter businesses when selectedService, searchTerm, or allBusinesses changes
// // //   useEffect(() => {
// // //     let businessesToFilter = allBusinesses;

// // //     // Filter by service
// // //     if (selectedService !== 'All Services') {
// // //       businessesToFilter = businessesToFilter.filter(
// // //         business => business.serviceProvided === selectedService
// // //       );
// // //     }

// // //     // Filter by search term
// // //     if (searchTerm) {
// // //       businessesToFilter = businessesToFilter.filter(business =>
// // //         business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //         business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //         business.id?.toString().includes(searchTerm)
// // //       );
// // //     }

// // //     setFilteredBusinesses(businessesToFilter);
// // //   }, [selectedService, searchTerm, allBusinesses]);

// // //   // Show delete confirmation
// // //   const showDeleteConfirmation = (businessId, businessName) => {
// // //     setConfirmModal({
// // //       isOpen: true,
// // //       message: `Are you sure you want to delete "${businessName}"? This action cannot be undone.`,
// // //       businessToDelete: businessId,
// // //       businessName: businessName
// // //     });
// // //   };

// // //   // Handle actual deletion after confirmation
// // //   const handleDeleteBusiness = async () => {
// // //     const businessId = confirmModal.businessToDelete;
// // //     setConfirmModal({ ...confirmModal, isOpen: false });
// // //     setDeletingId(businessId);
// // //     setErrorList(null);

// // //     try {
// // //       await deleteBusinessPartner(businessId);
      
// // //       // Remove from local state
// // //       setAllBusinesses(prevBusinesses => 
// // //         prevBusinesses.filter(business => business.id !== businessId)
// // //       );
// // //       setFilteredBusinesses(prevBusinesses => 
// // //         prevBusinesses.filter(business => business.id !== businessId)
// // //       );
// // //     } catch (err) {
// // //       console.error(`Failed to delete business ${businessId}:`, err);
// // //       setErrorList(err);
// // //     } finally {
// // //       setDeletingId(null);
// // //     }
// // //   };

// // //   const approvedVendorCount = allBusinesses.length;

// // //   return (
// // //     <div className={`business-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// // //       <PageHeader title="Business Management" showBreadcrumb={true} />

// // //       {/* Header Actions */}
// // //       <div className="business-management-actions">
// // //         <div className="search-bar">
// // //           <input 
// // //             type="text" 
// // //             placeholder="Search" 
// // //             value={searchTerm}
// // //             onChange={(e) => setSearchTerm(e.target.value)}
// // //           />
// // //           <span className="search-icon">🔍</span>
// // //         </div>
// // //         <div className="total-vendors">
// // //           Total Vendors : {isLoadingList ? '...' : approvedVendorCount}
// // //         </div>
// // //       </div>

// // //       {isLoadingList && <p className="loading-message">Loading vendors list...</p>}
// // //       {errorList && (
// // //         <p className="error-message">
// // //           Error: {typeof errorList === 'string' ? errorList : errorList.message || 'Unknown error'}
// // //         </p>
// // //       )}

// // //       {/* Table Section */}
// // //       <div className="business-table-container">
// // //         <table className="business-table">
// // //           <thead>
// // //             <tr>
// // //               <th>Name</th>
// // //               <th>
// // //                 <div className="catering-dropdown">
// // //                   <div className="catering-dropdown-header" onClick={toggleServiceDropdown}>
// // //                     Services <span className="catering-dropdown-arrow">▼</span>
// // //                   </div>
// // //                   {isServiceDropdownOpen && (
// // //                     <ul className="catering-dropdown-options">
// // //                       {serviceFilterOptions.map((option) => (
// // //                         <li
// // //                           key={option}
// // //                           className="catering-dropdown-option"
// // //                           onClick={() => handleServiceSelect(option)}
// // //                         >
// // //                           {option}
// // //                         </li>
// // //                       ))}
// // //                     </ul>
// // //                   )}
// // //                 </div>
// // //               </th>
// // //               <th>Phone Number</th>
// // //               <th>Subscription</th>
// // //               <th>Status</th>
// // //               <th>Actions</th>
// // //             </tr>
// // //           </thead>
// // //           <tbody>
// // //             {!isLoadingList && !errorList && filteredBusinesses.length > 0 ? (
// // //               filteredBusinesses.map((business) => {
// // //                 console.log(
// // //                   `BusinessManagement - Rendering Row: ID=${business.id}, Name="${business.businessName}", isApproved=${business.isApproved}`
// // //                 );
// // //                 const isActive = business.isApproved;
// // //                 const isDeleting = deletingId === business.id;
                
// // //                 return (
// // //                   <tr key={business.id}>
// // //                     <td>{business.businessName}</td>
// // //                     <td>{business.serviceProvided || 'Catering'}</td>
// // //                     <td>{business.phoneNumber}</td>
// // //                     <td>3 Months</td>
// // //                     <td>
// // //                       <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
// // //                         {isActive ? 'Active' : 'Inactive'}
// // //                       </span>
// // //                     </td>
// // //                     <td>
// // //                       <div className="action-buttons">
// // //                         <Link 
// // //                           to={`/business-profile/${business.id}`} 
// // //                           className="view-profile-link"
// // //                         >
// // //                           view profile
// // //                         </Link>
// // //                         <button
// // //                           onClick={() => showDeleteConfirmation(business.id, business.businessName)}
// // //                           className="delete-business-button"
// // //                           disabled={isDeleting}
// // //                           title="Delete Business"
// // //                         >
// // //                           {isDeleting ? (
// // //                             <FaSpinner className="spinner-icon" />
// // //                           ) : (
// // //                             <FaTrash />
// // //                           )}
// // //                         </button>
// // //                       </div>
// // //                     </td>
// // //                   </tr>
// // //                 );
// // //               })
// // //             ) : !isLoadingList && !errorList && filteredBusinesses.length === 0 ? (
// // //               <tr>
// // //                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
// // //                   {searchTerm ? 'No vendors found matching your search.' : 'No vendors found.'}
// // //                 </td>
// // //               </tr>
// // //             ) : null}
// // //           </tbody>
// // //         </table>
// // //       </div>

// // //       <ConfirmModal
// // //         isOpen={confirmModal.isOpen}
// // //         message={confirmModal.message}
// // //         onConfirm={handleDeleteBusiness}
// // //         onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
// // //       />
// // //     </div>
// // //   );
// // // }

// // // export default BusinessManagement;

// // // // import { useState, useEffect } from 'react';
// // // // import PageHeader from '../components/PageHeader';
// // // // import '../styles/BusinessManagement.css';
// // // // import { getAllBusinessPartners, deleteBusinessPartner } from '../services/apiService';
// // // // import { Link, useNavigate } from 'react-router-dom';
// // // // import { FaTrash, FaSpinner } from 'react-icons/fa';
// // // // import AlertModal from '../components/AlertModal';
// // // // import ConfirmModal from '../components/ConfirmModal';

// // // // function BusinessManagement({ isSidebarOpen }) {
// // // //   const [allBusinesses, setAllBusinesses] = useState([]);
// // // //   const [filteredBusinesses, setFilteredBusinesses] = useState([]);
// // // //   const [isLoadingList, setIsLoadingList] = useState(true);
// // // //   const [errorList, setErrorList] = useState(null);
// // // //   const [searchTerm, setSearchTerm] = useState('');
// // // //   const [deletingId, setDeletingId] = useState(null);
// // // //   const [alertModal, setAlertModal] = useState({
// // // //     isOpen: false,
// // // //     type: 'success',
// // // //     message: ''
// // // //   });
  
// // // //   const [confirmModal, setConfirmModal] = useState({
// // // //     isOpen: false,
// // // //     message: '',
// // // //     businessToDelete: null,
// // // //     businessName: ''
// // // //   });

// // // //   const navigate = useNavigate();

// // // //   // State for the service type dropdown in the header
// // // //   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
// // // //   const [selectedService, setSelectedService] = useState('All Services');
  
// // // //   // Options for the dropdown
// // // //   const serviceFilterOptions = ['All Services', 'Wedding', 'Reception', 'Birthday', 'Anniversary', 'Corporate Event'];

// // // //   // Toggle dropdown visibility
// // // //   const toggleServiceDropdown = () => {
// // // //     setIsServiceDropdownOpen(!isServiceDropdownOpen);
// // // //   };

// // // //   // Handle selection of a service option
// // // //   const handleServiceSelect = (value) => {
// // // //     setSelectedService(value);
// // // //     setIsServiceDropdownOpen(false);
// // // //   };

// // // //   // Effect to fetch all business partners list
// // // //   useEffect(() => {
// // // //     loadVendors();
// // // //   }, []);

// // // //   const loadVendors = async () => {
// // // //     try {
// // // //       setIsLoadingList(true);
// // // //       setErrorList(null);
// // // //       const data = await getAllBusinessPartners();
// // // //       setAllBusinesses((data || []).filter(business => business.isApproved));
// // // //       setFilteredBusinesses((data || []).filter(business => business.isApproved));
// // // //       setAlertModal({
// // // //         isOpen: true,
// // // //         type: 'success',
// // // //         message: 'Vendors loaded successfully'
// // // //       });
// // // //     } catch (err) {
// // // //       setErrorList(err);
// // // //       console.error("Failed to fetch business partners list:", err);
// // // //       setAllBusinesses([]);
// // // //       setFilteredBusinesses([]);
// // // //       setAlertModal({
// // // //         isOpen: true,
// // // //         type: 'error',
// // // //         message: 'Failed to load vendors. Please try again.'
// // // //       });
// // // //     } finally {
// // // //       setIsLoadingList(false);
// // // //     }
// // // //   };

// // // //   // Effect to filter businesses when selectedService, searchTerm, or allBusinesses changes
// // // //   useEffect(() => {
// // // //     let businessesToFilter = allBusinesses;

// // // //     // Filter by service
// // // //     if (selectedService !== 'All Services') {
// // // //       businessesToFilter = businessesToFilter.filter(
// // // //         business => business.serviceProvided === selectedService
// // // //       );
// // // //     }

// // // //     // Filter by search term
// // // //     if (searchTerm) {
// // // //       businessesToFilter = businessesToFilter.filter(business =>
// // // //         business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // // //         business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // // //         business.id?.toString().includes(searchTerm)
// // // //       );
// // // //     }

// // // //     setFilteredBusinesses(businessesToFilter);
// // // //   }, [selectedService, searchTerm, allBusinesses]);

// // // //   // Show delete confirmation
// // // //   const showDeleteConfirmation = (businessId, businessName) => {
// // // //     setConfirmModal({
// // // //       isOpen: true,
// // // //       message: `Are you sure you want to delete "${businessName}"? This action cannot be undone.`,
// // // //       businessToDelete: businessId,
// // // //       businessName: businessName
// // // //     });
// // // //   };

// // // //   // Handle actual deletion after confirmation
// // // //   const handleDeleteBusiness = async () => {
// // // //     const businessId = confirmModal.businessToDelete;
// // // //     setConfirmModal({ ...confirmModal, isOpen: false });
// // // //     setDeletingId(businessId);
// // // //     setErrorList(null);

// // // //     try {
// // // //       await deleteBusinessPartner(businessId);
      
// // // //       // Remove from local state
// // // //       setAllBusinesses(prevBusinesses => 
// // // //         prevBusinesses.filter(business => business.id !== businessId)
// // // //       );
// // // //       setFilteredBusinesses(prevBusinesses => 
// // // //         prevBusinesses.filter(business => business.id !== businessId)
// // // //       );

// // // //       setAlertModal({
// // // //         isOpen: true,
// // // //         type: 'success',
// // // //         message: 'Business successfully deleted'
// // // //       });
// // // //     } catch (err) {
// // // //       console.error(`Failed to delete business ${businessId}:`, err);
// // // //       setAlertModal({
// // // //         isOpen: true,
// // // //         type: 'error',
// // // //         message: 'Failed to delete business. Please try again.'
// // // //       });
// // // //     } finally {
// // // //       setDeletingId(null);
// // // //     };
// // // //   };

// // // //   const approvedVendorCount = allBusinesses.length;

// // // //   return (
// // // //     <div className={`business-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// // // //       <PageHeader title="Business Management" showBreadcrumb={true} />

// // // //       {/* Header Actions */}
// // // //       <div className="business-management-actions">
// // // //         <div className="search-bar">
// // // //           <input 
// // // //             type="text" 
// // // //             placeholder="Search" 
// // // //             value={searchTerm}
// // // //             onChange={(e) => setSearchTerm(e.target.value)}
// // // //           />
// // // //           <span className="search-icon">🔍</span>
// // // //         </div>
// // // //         <div className="total-vendors">
// // // //           Total Vendors : {isLoadingList ? '...' : approvedVendorCount}
// // // //         </div>
// // // //       </div>

// // // //       {isLoadingList && <p className="loading-message">Loading vendors list...</p>}
// // // //       {errorList && (
// // // //         <p className="error-message">
// // // //           Error: {typeof errorList === 'string' ? errorList : errorList.message || 'Unknown error'}
// // // //         </p>
// // // //       )}

// // // //       {/* Table Section */}
// // // //       <div className="business-table-container">
// // // //         <table className="business-table">
// // // //           <thead>
// // // //             <tr>
// // // //               <th>Name</th>
// // // //               <th>
// // // //                 <div className="catering-dropdown">
// // // //                   <div className="catering-dropdown-header" onClick={toggleServiceDropdown}>
// // // //                     Services <span className="catering-dropdown-arrow">▼</span>
// // // //                   </div>
// // // //                   {isServiceDropdownOpen && (
// // // //                     <ul className="catering-dropdown-options">
// // // //                       {serviceFilterOptions.map((option) => (
// // // //                         <li
// // // //                           key={option}
// // // //                           className="catering-dropdown-option"
// // // //                           onClick={() => handleServiceSelect(option)}
// // // //                         >
// // // //                           {option}
// // // //                         </li>
// // // //                       ))}
// // // //                     </ul>
// // // //                   )}
// // // //                 </div>
// // // //               </th>
// // // //               <th>Phone Number</th>
// // // //               <th>Subscription</th>
// // // //               <th>Status</th>
// // // //               <th>Actions</th>
// // // //             </tr>
// // // //           </thead>
// // // //           <tbody>
// // // //             {!isLoadingList && !errorList && filteredBusinesses.length > 0 ? (
// // // //               filteredBusinesses.map((business) => {
// // // //                 console.log(
// // // //                   `BusinessManagement - Rendering Row: ID=${business.id}, Name="${business.businessName}", isApproved=${business.isApproved}`
// // // //                 );
// // // //                 const isActive = business.isApproved;
// // // //                 const isDeleting = deletingId === business.id;
                
// // // //                 return (
// // // //                   <tr key={business.id}>
// // // //                     <td>{business.businessName}</td>
// // // //                     <td>{business.serviceProvided || 'Catering'}</td>
// // // //                     <td>{business.phoneNumber}</td>
// // // //                     <td>3 Months</td>
// // // //                     <td>
// // // //                       <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
// // // //                         {isActive ? 'Active' : 'Inactive'}
// // // //                       </span>
// // // //                     </td>
// // // //                     <td>
// // // //                       <div className="action-buttons">
// // // //                         <Link 
// // // //                           to={`/business-profile/${business.id}`} 
// // // //                           className="view-profile-link"
// // // //                         >
// // // //                           view profile
// // // //                         </Link>
// // // //                         <button
// // // //                           onClick={() => showDeleteConfirmation(business.id, business.businessName)}
// // // //                           className="delete-business-button"
// // // //                           disabled={isDeleting}
// // // //                           title="Delete Business"
// // // //                         >
// // // //                           {isDeleting ? (
// // // //                             <FaSpinner className="spinner-icon" />
// // // //                           ) : (
// // // //                             <FaTrash />
// // // //                           )}
// // // //                         </button>
// // // //                       </div>
// // // //                     </td>
// // // //                   </tr>
// // // //                 );
// // // //               })
// // // //             ) : !isLoadingList && !errorList && filteredBusinesses.length === 0 ? (
// // // //               <tr>
// // // //                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
// // // //                   {searchTerm ? 'No vendors found matching your search.' : 'No vendors found.'}
// // // //                 </td>
// // // //               </tr>
// // // //             ) : null}
// // // //           </tbody>
// // // //         </table>
// // // //       </div>

// // // //       <AlertModal
// // // //         isOpen={alertModal.isOpen}
// // // //         type={alertModal.type}
// // // //         message={alertModal.message}
// // // //         onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
// // // //       />

// // // //       <ConfirmModal
// // // //         isOpen={confirmModal.isOpen}
// // // //         message={confirmModal.message}
// // // //         onConfirm={handleDeleteBusiness}
// // // //         onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
// // // //       />
// // // //     </div>
// // // //   );
// // // // }

// // // // export default BusinessManagement;

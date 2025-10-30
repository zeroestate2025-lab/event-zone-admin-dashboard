import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import '../styles/BusinessManagement.css';
import { getAllBusinessPartners, deleteBusinessPartner } from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaSpinner } from 'react-icons/fa';

function BusinessManagement({ isSidebarOpen }) {
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [errorList, setErrorList] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  // State for the service type dropdown in the header
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('All Services');
  
  // Options for the dropdown
  const serviceFilterOptions = ['All Services', 'Wedding', 'Reception', 'Birthday', 'Anniversary', 'Corporate Event'];

  // Toggle dropdown visibility
  const toggleServiceDropdown = () => {
    setIsServiceDropdownOpen(!isServiceDropdownOpen);
  };

  // Handle selection of a service option
  const handleServiceSelect = (value) => {
    setSelectedService(value);
    setIsServiceDropdownOpen(false);
  };

  // Effect to fetch all business partners list
  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setIsLoadingList(true);
      setErrorList(null);
      const data = await getAllBusinessPartners();
      console.log("Fetched All Businesses:", JSON.stringify(data, null, 2));
      setAllBusinesses((data || []).filter(business => business.isApproved));
      setFilteredBusinesses((data || []).filter(business => business.isApproved)); 
    } catch (err) {
      setErrorList(err);
      console.error("Failed to fetch business partners list:", err);
      setAllBusinesses([]);
      setFilteredBusinesses([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Effect to filter businesses when selectedService, searchTerm, or allBusinesses changes
  useEffect(() => {
    let businessesToFilter = allBusinesses;

    // Filter by service
    if (selectedService !== 'All Services') {
      businessesToFilter = businessesToFilter.filter(
        business => business.serviceProvided === selectedService
      );
    }

    // Filter by search term
    if (searchTerm) {
      businessesToFilter = businessesToFilter.filter(business =>
        business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.id?.toString().includes(searchTerm)
      );
    }

    setFilteredBusinesses(businessesToFilter);
  }, [selectedService, searchTerm, allBusinesses]);

  // Handle delete business
  const handleDeleteBusiness = async (businessId, businessName) => {
    if (!window.confirm(`Are you sure you want to delete "${businessName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(businessId);
    setErrorList(null);

    try {
      await deleteBusinessPartner(businessId);
      
      // Remove from local state
      setAllBusinesses(prevBusinesses => 
        prevBusinesses.filter(business => business.id !== businessId)
      );
      setFilteredBusinesses(prevBusinesses => 
        prevBusinesses.filter(business => business.id !== businessId)
      );

      console.log(`Business ${businessId} deleted successfully`);
    } catch (err) {
      console.error(`Failed to delete business ${businessId}:`, err);
      setErrorList(err.message || 'Failed to delete business. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const approvedVendorCount = allBusinesses.length;

  return (
    <div className={`business-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <PageHeader title="Business Management" showBreadcrumb={true} />

      {/* Header Actions */}
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
        <div className="total-vendors">
          Total Vendors : {isLoadingList ? '...' : approvedVendorCount}
        </div>
      </div>

      {isLoadingList && <p className="loading-message">Loading vendors list...</p>}
      {errorList && (
        <p className="error-message">
          Error: {typeof errorList === 'string' ? errorList : errorList.message || 'Unknown error'}
        </p>
      )}

      {/* Table Section */}
      <div className="business-table-container">
        <table className="business-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>
                <div className="catering-dropdown">
                  <div className="catering-dropdown-header" onClick={toggleServiceDropdown}>
                    Catering <span className="catering-dropdown-arrow">▼</span>
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
                console.log(
                  `BusinessManagement - Rendering Row: ID=${business.id}, Name="${business.businessName}", isApproved=${business.isApproved}`
                );
                const isActive = business.isApproved;
                const isDeleting = deletingId === business.id;
                
                return (
                  <tr key={business.id}>
                    <td>{business.businessName}</td>
                    <td>{business.serviceProvided || 'Catering'}</td>
                    <td>{business.phoneNumber}</td>
                    <td>3 Months</td>
                    <td>
                      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Active' : 'Inactive'}
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
                          onClick={() => handleDeleteBusiness(business.id, business.businessName)}
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
                  {searchTerm ? 'No vendors found matching your search.' : 'No vendors found.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BusinessManagement;

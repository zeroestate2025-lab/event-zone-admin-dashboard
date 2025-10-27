import { useState, useEffect } from 'react';
import '../styles/BusinessManagement.css';
// Assuming your API service functions are in a file like 'apiService.js'
// You might need to adjust the path based on your project structure.
import { getAllBusinessPartners } from '../services/apiService'; // getBusinessPartnerCount might not be needed if we count client-side
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate


function BusinessManagement({ isSidebarOpen }) {
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [errorList, setErrorList] = useState(null);

  // We will derive approvedVendorCount from the allBusinesses list
  const navigate = useNavigate(); // Initialize useNavigate

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
    setIsServiceDropdownOpen(false); // Close the dropdown after selection
  };

  // Effect to fetch all business partners list
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setIsLoadingList(true);
        setErrorList(null);
        const data = await getAllBusinessPartners();
        console.log("Fetched All Businesses (Raw from API in BusinessManagement):", JSON.stringify(data, null, 2));
        // Filter for approved businesses
        setAllBusinesses((data || []).filter(business => business.isApproved));
        // Initially, filteredBusinesses should also respect the approved filter.
        // If you want to show all and then filter, the logic for allBusinesses and filteredBusinesses initialization would differ.
        // For now, assuming filteredBusinesses should also start with approved ones.
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
    loadVendors();
  }, []);

  // Effect to filter businesses when selectedService or allBusinesses changes
  useEffect(() => {
    // allBusinesses state already contains only approved businesses from the initial load
    const businessesToFilter = allBusinesses;

    if (selectedService === 'All Services') {
      setFilteredBusinesses(businessesToFilter);
    } else {
      setFilteredBusinesses(
        businessesToFilter.filter(business => business.serviceProvided === selectedService)
      );
    }
  }, [selectedService, allBusinesses]);

  const approvedVendorCount = allBusinesses.length; // Since allBusinesses now only stores approved ones


  return (
    <div className={`business-management ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header Section */}
      <div className="business-management-header">
        <div className="header-left">
          <span className="back-arrow" onClick={() => navigate(-1)} style={{cursor: 'pointer'}}>←</span>
          <h1>Business Management</h1>
        </div>
        <div className="header-right">
          {/* <div className="search-bar">
            <input type="text" placeholder="Search" />
            <span className="search-icon">🔍</span>
          </div> */}
          <div className="total-vendors">
            <span>Total Approved Vendors: {isLoadingList ? '...' : approvedVendorCount}</span>
          </div>
        </div>
      </div>

      {isLoadingList && <p className="loading-message">Loading vendors list...</p>}
      {errorList && (
        <p className="error-message">
          Error fetching vendors list: {typeof errorList === 'string' ? errorList : errorList.message || 'Unknown error'}
        </p>
      )}


      {/* Table Section */}
      <div className="business-table-container">
        <table className="business-table">
          <thead>
            <tr>
              <th>Business ID</th>
              <th>Name</th>
              <th>
                <div className="custom-dropdown">
                  <div className="dropdown-header" onClick={toggleServiceDropdown}>
                    {selectedService} <span className="dropdown-arrow">▼</span>
                  </div>
                  {isServiceDropdownOpen && (
                    <ul className="dropdown-options">
                      {serviceFilterOptions.map((option) => (
                        <li
                          key={option}
                          className="dropdown-option"
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
              <th>Status</th>
              <th></th>

            </tr>
          </thead>
          <tbody>
            {!isLoadingList && !errorList && filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => {
                // Log the specific business object and its isApproved status right before rendering
                console.log(
                  `BusinessManagement - Rendering Row: ID=${business.id}, Name="${business.businessName}", isApproved=${business.isApproved} (Type: ${typeof business.isApproved})`
                );
                const isActive = business.isApproved; // isApproved should already be a boolean
                return (
                  <tr key={business.id}>
                    <td>{business.id}</td>
                    <td>{business.businessName}</td>
                    <td>{business.serviceProvided}</td>
                    <td>{business.phoneNumber}</td>
                    <td>
                      <span className={`status ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                     <td>
                      <Link to={`/business-profile/${business.id}`} className="view-profile">
                        view profile
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : !isLoadingList && !errorList && filteredBusinesses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No vendors found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BusinessManagement;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Approvals.css';

function Approvals({ isSidebarOpen }) {
  // State for dropdowns in headers
  const [isCateringDropdownOpen, setIsCateringDropdownOpen] = useState(false);
  const [isPaidDropdownOpen, setIsPaidDropdownOpen] = useState(false);
  const [selectedCatering, setSelectedCatering] = useState('Catering');
  const [selectedPaid, setSelectedPaid] = useState('Paid');

  // Options for dropdowns
  const cateringOptions = ['Catering', 'Option 1', 'Option 2', 'Option 3'];
  const paidOptions = ['Paid', 'Unpaid', 'Pending'];

  // Toggle dropdown visibility
  const toggleCateringDropdown = () => setIsCateringDropdownOpen(!isCateringDropdownOpen);
  const togglePaidDropdown = () => setIsPaidDropdownOpen(!isPaidDropdownOpen);

  // Handle selection of options
  const handleCateringSelect = (value) => {
    setSelectedCatering(value);
    setIsCateringDropdownOpen(false);
  };
  const handlePaidSelect = (value) => {
    setSelectedPaid(value);
    setIsPaidDropdownOpen(false);
  };

  // Static data for the table (can be replaced with API data)
  const initialBusinesses = [
    { name: 'John Events', catering: 'Catering', phone: '9878987654', plan: '3 Months', paid: 'Paid' },
    { name: 'John Events', catering: 'Catering', phone: '9878987654', plan: '3 Months', paid: 'Paid' },
    { name: 'John Events', catering: 'Catering', phone: '9878987654', plan: '3 Months', paid: 'Paid' },
    { name: 'John Events', catering: 'Catering', phone: '9878987654', plan: '3 Months', paid: 'Paid' },
    { name: 'John Events', catering: 'Catering', phone: '9878987654', plan: '3 Months', paid: 'Paid' },
  ];

  return (
    <div className={`approvals ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header Section */}
      <div className="approvals-header">
        <div className="header-left">
          <span className="back-arrow">←</span>
          <h1>Approvals</h1>
        </div>
        <div className="header-right">
          <div className="search-bar">
            <input type="text" placeholder="Search" />
            <span className="search-icon">🔍</span>
          </div>
          <div className="date-dropdown">
            <span onClick={() => {}} className="date-text">Today</span>
            <span className="dropdown-arrow">▼</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <table className="approvals-table">
          <thead>
            <tr>
              <th>Businessname</th>
              <th>
                <div className="custom-dropdown">
                  <div className="dropdown-header" onClick={toggleCateringDropdown}>
                    {selectedCatering} <span className="dropdown-arrow">▼</span>
                  </div>
                  {isCateringDropdownOpen && (
                    <ul className="dropdown-options">
                      {cateringOptions.map((option) => (
                        <li
                          key={option}
                          className="dropdown-option"
                          onClick={() => handleCateringSelect(option)}
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
                <div className="custom-dropdown">
                  <div className="dropdown-header" onClick={togglePaidDropdown}>
                    {selectedPaid} <span className="dropdown-arrow">▼</span>
                  </div>
                  {isPaidDropdownOpen && (
                    <ul className="dropdown-options">
                      {paidOptions.map((option) => (
                        <li
                          key={option}
                          className="dropdown-option"
                          onClick={() => handlePaidSelect(option)}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {initialBusinesses.map((business, index) => (
              <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <td>{business.name}</td>
                <td>{business.catering}</td>
                <td>{business.phone}</td>
                <td>{business.plan}</td>
                <td>{business.paid}</td>
                <td>
                  <Link
                    to="/view-details"
                    state={{
                      data: {
                        proprietorName: business.name,
                        email: 'john@gmail.com',
                        businessName: business.name,
                        service: business.catering,
                        phoneNumber: business.phone,
                        state: 'Tamilnadu',
                        district: 'Coimbatore',
                        location: '12/1 Avinashi Road, Coimbatore',
                        plan: business.plan,
                        paymentStatus: business.paid,
                        paymentMode: 'Gpay',
                      },
                    }}
                    className="view-link"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Approvals;
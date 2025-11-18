import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PageHeader from '../components/PageHeader';
import "../styles/Subscriptions.css";
import { getAllPayments, deletePaymentById } from "../services/apiService";
import { FaTrash, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function Subscriptions({ isSidebarOpen }) {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Status tab state
  const [activeTab, setActiveTab] = useState("completed");

  // Animated counter state
  const [displayAmount, setDisplayAmount] = useState(0);
  const animationRef = useRef(null);

  // Calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Month filter state
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("All");

  // State for service dropdown filter
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("All");

  const serviceOptions = ["All", "Catering", "Photography", "Decoration", "Venue"];

  const monthOptions = [
    "All",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);
  const toggleMonthDropdown = () => setIsMonthDropdownOpen(!isMonthDropdownOpen);

  const handleServiceSelect = (value) => {
    setSelectedService(value);
    setIsServiceDropdownOpen(false);
  };

  const handleMonthSelect = (value) => {
    setSelectedMonth(value);
    setIsMonthDropdownOpen(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllPayments();
      setPayments(data || []);
      setFilteredPayments(data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Failed to load payment data");
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine if payment is successful
  const isPaymentSuccessful = (payment) => {
    const status = payment.status?.toLowerCase();
    return status === 'success' || status === 'paid' || status === 'completed';
  };

  // Filter payments based on search, service selection, date, month, and status tab
  useEffect(() => {
    let paymentsToFilter = payments;

    // Filter by status tab
    if (activeTab === 'completed') {
      paymentsToFilter = paymentsToFilter.filter(payment => isPaymentSuccessful(payment));
    } else if (activeTab === 'pending') {
      paymentsToFilter = paymentsToFilter.filter(payment => !isPaymentSuccessful(payment));
    }

    // Filter by service (if needed, adjust based on your payment data structure)
    if (selectedService !== 'All') {
      paymentsToFilter = paymentsToFilter.filter(
        payment => payment.service === selectedService
      );
    }

    // Filter by month
    if (selectedMonth !== 'All') {
      const monthIndex = monthOptions.indexOf(selectedMonth) - 1;
      paymentsToFilter = paymentsToFilter.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate.getMonth() === monthIndex;
      });
    }

    // Filter by selected date
    if (selectedDate) {
      paymentsToFilter = paymentsToFilter.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return (
          paymentDate.getFullYear() === selectedDate.getFullYear() &&
          paymentDate.getMonth() === selectedDate.getMonth() &&
          paymentDate.getDate() === selectedDate.getDate()
        );
      });
    }

    // Filter by search term
    if (searchTerm) {
      paymentsToFilter = paymentsToFilter.filter(payment =>
        payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.user?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id?.toString().includes(searchTerm)
      );
    }

    setFilteredPayments(paymentsToFilter);
  }, [selectedService, searchTerm, payments, selectedDate, selectedMonth, activeTab]);

  // Animated counter effect - ONLY FOR SUCCESSFUL PAYMENTS
  useEffect(() => {
    const successfulPayments = filteredPayments.filter(p => isPaymentSuccessful(p));
    
    const totalAmount = successfulPayments.reduce((sum, p) => sum + ((p.amount || 0) / 100), 0);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setDisplayAmount(0);

    const duration = 2000;
    const startTime = Date.now();
    const startAmount = 0;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuad = (t) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      const currentAmount = Math.floor(startAmount + (totalAmount - startAmount) * easedProgress);
      setDisplayAmount(currentAmount);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayAmount(totalAmount);
      }
    };

    if (totalAmount > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setDisplayAmount(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [filteredPayments]);

  const handleDeletePayment = async (paymentId, paymentName) => {
    if (!window.confirm(`Are you sure you want to delete payment for "${paymentName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(paymentId);
    setError("");

    try {
      await deletePaymentById(paymentId);
      
      setPayments(prevPayments => 
        prevPayments.filter(payment => payment.id !== paymentId)
      );
      setFilteredPayments(prevPayments => 
        prevPayments.filter(payment => payment.id !== paymentId)
      );

      console.log(`Payment ${paymentId} deleted successfully`);
    } catch (err) {
      console.error(`Failed to delete payment ${paymentId}:`, err);
      setError(err.message || 'Failed to delete payment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(selected);
    setIsCalendarOpen(false);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setIsCalendarOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return "Select Date";
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  // Helper function to convert paise to rupees
  const convertToRupees = (paise) => {
    return Math.round((paise / 100) * 100) / 100;
  };

  return (
    <div className={`subscriptions ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <PageHeader title="Subscription" showBreadcrumb={true} />

      {/* Status Tabs */}
      <div className="status-tabs">
        <button
          className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
        <button
          className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
      </div>

      {/* Header Actions */}
      <div className="subscriptions-actions">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="filter-buttons">
          {/* Month Filter Dropdown */}
          <div className="month-filter">
            <button 
              className="filter-button month-button"
              onClick={toggleMonthDropdown}
            >
              <span className="filter-icon">📊</span>
              {selectedMonth}
            </button>

            {isMonthDropdownOpen && (
              <div className="month-dropdown">
                {monthOptions.map((month) => (
                  <div
                    key={month}
                    className={`month-option ${selectedMonth === month ? 'selected' : ''}`}
                    onClick={() => handleMonthSelect(month)}
                  >
                    {month}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Button */}
          <div className="calendar-filter">
            <button 
              className="filter-button calendar-button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            >
              <span className="filter-icon">📅</span>
              {formatDate(selectedDate)}
            </button>

            {isCalendarOpen && (
              <div className="calendar-dropdown">
                <div className="calendar-header">
                  <button 
                    className="calendar-nav-button"
                    onClick={handlePreviousMonth}
                  >
                    <FaChevronLeft />
                  </button>
                  <h3 className="calendar-month-year">{monthYear}</h3>
                  <button 
                    className="calendar-nav-button"
                    onClick={handleNextMonth}
                  >
                    <FaChevronRight />
                  </button>
                </div>

                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="weekday">{day}</div>
                  ))}
                </div>

                <div className="calendar-days">
                  {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day empty"></div>
                  ))}
                  {days.map(day => {
                    const isSelected = selectedDate &&
                      selectedDate.getFullYear() === currentMonth.getFullYear() &&
                      selectedDate.getMonth() === currentMonth.getMonth() &&
                      selectedDate.getDate() === day;
                    const isToday = 
                      new Date().getFullYear() === currentMonth.getFullYear() &&
                      new Date().getMonth() === currentMonth.getMonth() &&
                      new Date().getDate() === day;

                    return (
                      <button
                        key={day}
                        className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                        onClick={() => handleDateSelect(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="calendar-actions">
                  <button 
                    className="calendar-clear-btn"
                    onClick={handleClearDate}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="filter-button total-amount-counter">
            <span className="currency-symbol">₹</span>
            <span className="animated-amount">{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {loading && <p className="loading-message">Loading payments...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Table Section */}
      <div className="subscriptions-table-container">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>ID NO</th>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && filteredPayments.length > 0 ? (
              filteredPayments.map((payment, index) => {
                const isDeleting = deletingId === payment.id;
                const isPending = !isPaymentSuccessful(payment);
                const displayPaymentAmount = convertToRupees(payment.amount);
                
                return (
                  <tr key={payment.id || index}>
                    <td>{payment.id}</td>
                    <td>{payment.user?.name || "N/A"}</td>
                    <td>{payment.user?.phoneNumber || "N/A"}</td>
                    <td>₹{displayPaymentAmount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</td>
                    <td>
                      <span className={`status-badge ${payment.status?.toLowerCase() || 'pending'}`}>
                        {payment.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* Only show viewbill link for successful payments */}
                        {!isPending && (
                          <a
                            href={`https://dashboard.razorpay.com/app/orders/${payment.razorpayOrderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="viewbill-link"
                          >
                            Viewbill
                          </a>
                        )}
                        <button
                          onClick={() => handleDeletePayment(payment.id, payment.user?.name)}
                          className="delete-payment-button"
                          disabled={isDeleting}
                          title="Delete Payment"
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
            ) : !loading && !error && filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  {searchTerm || selectedDate || selectedMonth !== 'All' ? 'No payments found matching your search/filters.' : `No ${activeTab} payments found.`}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Subscriptions;

// import { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import PageHeader from '../components/PageHeader';
// import "../styles/Subscriptions.css";
// import { getAllPayments, deletePaymentById } from "../services/apiService";
// import { FaTrash, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';


// function Subscriptions({ isSidebarOpen }) {
//   const [payments, setPayments] = useState([]);
//   const [filteredPayments, setFilteredPayments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [searchTerm, setSearchTerm] = useState('');
//   const [deletingId, setDeletingId] = useState(null);

//   // Status tab state
//   const [activeTab, setActiveTab] = useState("completed"); // "completed" or "pending"

//   // Animated counter state
//   const [displayAmount, setDisplayAmount] = useState(0);
//   const animationRef = useRef(null);

//   // Calendar state
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [currentMonth, setCurrentMonth] = useState(new Date());

//   // Month filter state
//   const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
//   const [selectedMonth, setSelectedMonth] = useState("All");

//   // State for service dropdown filter
//   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
//   const [selectedService, setSelectedService] = useState("All");

//   const serviceOptions = ["All", "Catering", "Photography", "Decoration", "Venue"];

//   const monthOptions = [
//     "All",
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December"
//   ];

//   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);
//   const toggleMonthDropdown = () => setIsMonthDropdownOpen(!isMonthDropdownOpen);

//   const handleServiceSelect = (value) => {
//     setSelectedService(value);
//     setIsServiceDropdownOpen(false);
//   };

//   const handleMonthSelect = (value) => {
//     setSelectedMonth(value);
//     setIsMonthDropdownOpen(false);
//   };

//   useEffect(() => {
//     fetchPayments();
//   }, []);

//   const fetchPayments = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const data = await getAllPayments();
//       setPayments(data || []);
//       setFilteredPayments(data || []);
//     } catch (err) {
//       console.error("Error fetching payments:", err);
//       setError("Failed to load payment data");
//       setPayments([]);
//       setFilteredPayments([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Helper function to determine if payment is successful
//   const isPaymentSuccessful = (payment) => {
//     const status = payment.status?.toLowerCase();
//     return status === 'success' || status === 'paid' || status === 'completed';
//   };

//   // Filter payments based on search, service selection, date, month, and status tab
//   useEffect(() => {
//     let paymentsToFilter = payments;

//     // Filter by status tab
//     if (activeTab === 'completed') {
//       paymentsToFilter = paymentsToFilter.filter(payment => isPaymentSuccessful(payment));
//     } else if (activeTab === 'pending') {
//       paymentsToFilter = paymentsToFilter.filter(payment => !isPaymentSuccessful(payment));
//     }

//     // Filter by service (if needed, adjust based on your payment data structure)
//     if (selectedService !== 'All') {
//       paymentsToFilter = paymentsToFilter.filter(
//         payment => payment.service === selectedService
//       );
//     }

//     // Filter by month
//     if (selectedMonth !== 'All') {
//       const monthIndex = monthOptions.indexOf(selectedMonth) - 1; // -1 because "All" is at index 0
//       paymentsToFilter = paymentsToFilter.filter(payment => {
//         const paymentDate = new Date(payment.createdAt);
//         return paymentDate.getMonth() === monthIndex;
//       });
//     }

//     // Filter by selected date
//     if (selectedDate) {
//       paymentsToFilter = paymentsToFilter.filter(payment => {
//         const paymentDate = new Date(payment.createdAt);
//         return (
//           paymentDate.getFullYear() === selectedDate.getFullYear() &&
//           paymentDate.getMonth() === selectedDate.getMonth() &&
//           paymentDate.getDate() === selectedDate.getDate()
//         );
//       });
//     }

//     // Filter by search term
//     if (searchTerm) {
//       paymentsToFilter = paymentsToFilter.filter(payment =>
//         payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         payment.user?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         payment.id?.toString().includes(searchTerm)
//       );
//     }

//     setFilteredPayments(paymentsToFilter);
//   }, [selectedService, searchTerm, payments, selectedDate, selectedMonth, activeTab]);

//   // Animated counter effect - ONLY FOR SUCCESSFUL PAYMENTS
//   useEffect(() => {
//     // Only count payments with "success" or "paid" status
//     const successfulPayments = filteredPayments.filter(p => isPaymentSuccessful(p));
    
//     // Divide by 100 to convert from paise to rupees
//     const totalAmount = successfulPayments.reduce((sum, p) => sum + ((p.amount || 0) / 100), 0);
    
//     // Clear any existing animation
//     if (animationRef.current) {
//       cancelAnimationFrame(animationRef.current);
//     }

//     // Reset display amount when starting new animation
//     setDisplayAmount(0);

//     // Animation duration in milliseconds
//     const duration = 2000;
//     const startTime = Date.now();
//     const startAmount = 0;

//     const animate = () => {
//       const currentTime = Date.now();
//       const elapsed = currentTime - startTime;
//       const progress = Math.min(elapsed / duration, 1);

//       // Easing function for smooth animation (easeOutQuad)
//       const easeOutQuad = (t) => t * (2 - t);
//       const easedProgress = easeOutQuad(progress);

//       const currentAmount = Math.floor(startAmount + (totalAmount - startAmount) * easedProgress);
//       setDisplayAmount(currentAmount);

//       if (progress < 1) {
//         animationRef.current = requestAnimationFrame(animate);
//       } else {
//         setDisplayAmount(totalAmount); // Ensure we end with exact amount
//       }
//     };

//     if (totalAmount > 0) {
//       animationRef.current = requestAnimationFrame(animate);
//     } else {
//       setDisplayAmount(0);
//     }

//     // Cleanup function
//     return () => {
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//     };
//   }, [filteredPayments]);

//   const handleDeletePayment = async (paymentId, paymentName) => {
//     if (!window.confirm(`Are you sure you want to delete payment for "${paymentName}"? This action cannot be undone.`)) {
//       return;
//     }

//     setDeletingId(paymentId);
//     setError("");

//     try {
//       await deletePaymentById(paymentId);
      
//       setPayments(prevPayments => 
//         prevPayments.filter(payment => payment.id !== paymentId)
//       );
//       setFilteredPayments(prevPayments => 
//         prevPayments.filter(payment => payment.id !== paymentId)
//       );

//       console.log(`Payment ${paymentId} deleted successfully`);
//     } catch (err) {
//       console.error(`Failed to delete payment ${paymentId}:`, err);
//       setError(err.message || 'Failed to delete payment. Please try again.');
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // Calendar functions
//   const getDaysInMonth = (date) => {
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (date) => {
//     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
//   };

//   const handlePreviousMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
//   };

//   const handleNextMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
//   };

//   const handleDateSelect = (day) => {
//     const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
//     setSelectedDate(selected);
//     setIsCalendarOpen(false);
//   };

//   const handleClearDate = () => {
//     setSelectedDate(null);
//     setIsCalendarOpen(false);
//   };

//   const formatDate = (date) => {
//     if (!date) return "Select Date";
//     return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
//   };

//   const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
//   const daysInMonth = getDaysInMonth(currentMonth);
//   const firstDay = getFirstDayOfMonth(currentMonth);
//   const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
//   const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

//   // Helper function to convert paise to rupees
//   const convertToRupees = (paise) => {
//     return Math.round((paise / 100) * 100) / 100;
//   };

//   return (
//     <div className={`subscriptions ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
//       <PageHeader title="Subscription" showBreadcrumb={true} />

//       {/* Status Tabs */}
//       <div className="status-tabs">
//         <button
//           className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`}
//           onClick={() => setActiveTab('completed')}
//         >
//           Completed
//         </button>
//         <button
//           className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`}
//           onClick={() => setActiveTab('pending')}
//         >
//           Pending
//         </button>
//       </div>

//       {/* Header Actions */}
//       <div className="subscriptions-actions">
//         <div className="search-bar">
//           <input 
//             type="text" 
//             placeholder="Search" 
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <span className="search-icon">🔍</span>
//         </div>
//         <div className="filter-buttons">
//           {/* Month Filter Dropdown */}
//           <div className="month-filter">
//             <button 
//               className="filter-button month-button"
//               onClick={toggleMonthDropdown}
//             >
//               <span className="filter-icon">📊</span>
//               {selectedMonth}
//             </button>

//             {/* Month Dropdown */}
//             {isMonthDropdownOpen && (
//               <div className="month-dropdown">
//                 {monthOptions.map((month) => (
//                   <div
//                     key={month}
//                     className={`month-option ${selectedMonth === month ? 'selected' : ''}`}
//                     onClick={() => handleMonthSelect(month)}
//                   >
//                     {month}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Functional Calendar Button */}
//           <div className="calendar-filter">
//             <button 
//               className="filter-button calendar-button"
//               onClick={() => setIsCalendarOpen(!isCalendarOpen)}
//             >
//               <span className="filter-icon">📅</span>
//               {formatDate(selectedDate)}
//             </button>

//             {/* Calendar Dropdown */}
//             {isCalendarOpen && (
//               <div className="calendar-dropdown">
//                 <div className="calendar-header">
//                   <button 
//                     className="calendar-nav-button"
//                     onClick={handlePreviousMonth}
//                   >
//                     <FaChevronLeft />
//                   </button>
//                   <h3 className="calendar-month-year">{monthYear}</h3>
//                   <button 
//                     className="calendar-nav-button"
//                     onClick={handleNextMonth}
//                   >
//                     <FaChevronRight />
//                   </button>
//                 </div>

//                 <div className="calendar-weekdays">
//                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
//                     <div key={day} className="weekday">{day}</div>
//                   ))}
//                 </div>

//                 <div className="calendar-days">
//                   {emptyDays.map((_, i) => (
//                     <div key={`empty-${i}`} className="calendar-day empty"></div>
//                   ))}
//                   {days.map(day => {
//                     const isSelected = selectedDate &&
//                       selectedDate.getFullYear() === currentMonth.getFullYear() &&
//                       selectedDate.getMonth() === currentMonth.getMonth() &&
//                       selectedDate.getDate() === day;
//                     const isToday = 
//                       new Date().getFullYear() === currentMonth.getFullYear() &&
//                       new Date().getMonth() === currentMonth.getMonth() &&
//                       new Date().getDate() === day;

//                     return (
//                       <button
//                         key={day}
//                         className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
//                         onClick={() => handleDateSelect(day)}
//                       >
//                         {day}
//                       </button>
//                     );
//                   })}
//                 </div>

//                 <div className="calendar-actions">
//                   <button 
//                     className="calendar-clear-btn"
//                     onClick={handleClearDate}
//                   >
//                     Clear
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="filter-button total-amount-counter">
//             <span className="currency-symbol">₹</span>
//             <span className="animated-amount">{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</span>
//           </div>
//         </div>
//       </div>

//       {loading && <p className="loading-message">Loading payments...</p>}
//       {error && <p className="error-message">{error}</p>}

//       {/* Table Section */}
//       <div className="subscriptions-table-container">
//         <table className="subscriptions-table">
//           <thead>
//             <tr>
//               <th>ID NO</th>
//               <th>Name</th>
//               <th>Phone Number</th>
//               <th>Payment</th>
//               <th>Status</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {!loading && !error && filteredPayments.length > 0 ? (
//               filteredPayments.map((payment, index) => {
//                 const isDeleting = deletingId === payment.id;
//                 // Convert paise to rupees for display
//                 const displayPaymentAmount = convertToRupees(payment.amount);
                
//                 return (
//                   <tr key={payment.id || index}>
//                     <td>{payment.id}</td>
//                     <td>{payment.user?.name || "N/A"}</td>
//                     <td>{payment.user?.phoneNumber || "N/A"}</td>
//                     <td>₹{displayPaymentAmount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</td>
//                     <td>
//                       <span className={`status-badge ${payment.status?.toLowerCase() || 'pending'}`}>
//                         {payment.status || 'Pending'}
//                       </span>
//                     </td>
//                     <td>
//                       <div className="action-buttons">
//                         <a
//                           href={`https://dashboard.razorpay.com/app/orders/${payment.razorpayOrderId}`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="viewbill-link"
//                         >
//                           Viewbill
//                         </a>
//                         <button
//                           onClick={() => handleDeletePayment(payment.id, payment.user?.name)}
//                           className="delete-payment-button"
//                           disabled={isDeleting}
//                           title="Delete Payment"
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
//             ) : !loading && !error && filteredPayments.length === 0 ? (
//               <tr>
//                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
//                   {searchTerm || selectedDate || selectedMonth !== 'All' ? 'No payments found matching your search/filters.' : `No ${activeTab} payments found.`}
//                 </td>
//               </tr>
//             ) : null}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default Subscriptions;

// // import { useState, useEffect, useRef } from "react";
// // import { Link } from "react-router-dom";
// // import PageHeader from '../components/PageHeader';
// // import "../styles/Subscriptions.css";
// // import { getAllPayments, deletePaymentById } from "../services/apiService";
// // import { FaTrash, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// // function Subscriptions({ isSidebarOpen }) {
// //   const [payments, setPayments] = useState([]);
// //   const [filteredPayments, setFilteredPayments] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [deletingId, setDeletingId] = useState(null);

// //   // Animated counter state
// //   const [displayAmount, setDisplayAmount] = useState(0);
// //   const animationRef = useRef(null);

// //   // Calendar state
// //   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
// //   const [selectedDate, setSelectedDate] = useState(null);
// //   const [currentMonth, setCurrentMonth] = useState(new Date());

// //   // State for service dropdown filter
// //   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
// //   const [selectedService, setSelectedService] = useState("All");

// //   const serviceOptions = ["All", "Catering", "Photography", "Decoration", "Venue"];

// //   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);

// //   const handleServiceSelect = (value) => {
// //     setSelectedService(value);
// //     setIsServiceDropdownOpen(false);
// //   };

// //   useEffect(() => {
// //     fetchPayments();
// //   }, []);

// //   const fetchPayments = async () => {
// //     try {
// //       setLoading(true);
// //       setError("");
// //       const data = await getAllPayments();
// //       setPayments(data || []);
// //       setFilteredPayments(data || []);
// //     } catch (err) {
// //       console.error("Error fetching payments:", err);
// //       setError("Failed to load payment data");
// //       setPayments([]);
// //       setFilteredPayments([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Filter payments based on search, service selection, and date
// //   useEffect(() => {
// //     let paymentsToFilter = payments;

// //     // Filter by service (if needed, adjust based on your payment data structure)
// //     if (selectedService !== 'All') {
// //       paymentsToFilter = paymentsToFilter.filter(
// //         payment => payment.service === selectedService
// //       );
// //     }

// //     // Filter by selected date
// //     if (selectedDate) {
// //       paymentsToFilter = paymentsToFilter.filter(payment => {
// //         const paymentDate = new Date(payment.createdAt);
// //         return (
// //           paymentDate.getFullYear() === selectedDate.getFullYear() &&
// //           paymentDate.getMonth() === selectedDate.getMonth() &&
// //           paymentDate.getDate() === selectedDate.getDate()
// //         );
// //       });
// //     }

// //     // Filter by search term
// //     if (searchTerm) {
// //       paymentsToFilter = paymentsToFilter.filter(payment =>
// //         payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //         payment.user?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //         payment.id?.toString().includes(searchTerm)
// //       );
// //     }

// //     setFilteredPayments(paymentsToFilter);
// //   }, [selectedService, searchTerm, payments, selectedDate]);

// //   // Animated counter effect - ONLY FOR SUCCESSFUL PAYMENTS
// //   useEffect(() => {
// //     // Only count payments with "success" or "paid" status
// //     const successfulPayments = filteredPayments.filter(p => 
// //       p.status?.toLowerCase() === 'success' || 
// //       p.status?.toLowerCase() === 'paid' ||
// //       p.status?.toLowerCase() === 'completed'
// //     );
    
// //     // Divide by 100 to convert from paise to rupees
// //     const totalAmount = successfulPayments.reduce((sum, p) => sum + ((p.amount || 0) / 100), 0);
    
// //     // Clear any existing animation
// //     if (animationRef.current) {
// //       cancelAnimationFrame(animationRef.current);
// //     }

// //     // Reset display amount when starting new animation
// //     setDisplayAmount(0);

// //     // Animation duration in milliseconds
// //     const duration = 2000;
// //     const startTime = Date.now();
// //     const startAmount = 0;

// //     const animate = () => {
// //       const currentTime = Date.now();
// //       const elapsed = currentTime - startTime;
// //       const progress = Math.min(elapsed / duration, 1);

// //       // Easing function for smooth animation (easeOutQuad)
// //       const easeOutQuad = (t) => t * (2 - t);
// //       const easedProgress = easeOutQuad(progress);

// //       const currentAmount = Math.floor(startAmount + (totalAmount - startAmount) * easedProgress);
// //       setDisplayAmount(currentAmount);

// //       if (progress < 1) {
// //         animationRef.current = requestAnimationFrame(animate);
// //       } else {
// //         setDisplayAmount(totalAmount); // Ensure we end with exact amount
// //       }
// //     };

// //     if (totalAmount > 0) {
// //       animationRef.current = requestAnimationFrame(animate);
// //     } else {
// //       setDisplayAmount(0);
// //     }

// //     // Cleanup function
// //     return () => {
// //       if (animationRef.current) {
// //         cancelAnimationFrame(animationRef.current);
// //       }
// //     };
// //   }, [filteredPayments]);

// //   const handleDeletePayment = async (paymentId, paymentName) => {
// //     if (!window.confirm(`Are you sure you want to delete payment for "${paymentName}"? This action cannot be undone.`)) {
// //       return;
// //     }

// //     setDeletingId(paymentId);
// //     setError("");

// //     try {
// //       await deletePaymentById(paymentId);
      
// //       setPayments(prevPayments => 
// //         prevPayments.filter(payment => payment.id !== paymentId)
// //       );
// //       setFilteredPayments(prevPayments => 
// //         prevPayments.filter(payment => payment.id !== paymentId)
// //       );

// //       console.log(`Payment ${paymentId} deleted successfully`);
// //     } catch (err) {
// //       console.error(`Failed to delete payment ${paymentId}:`, err);
// //       setError(err.message || 'Failed to delete payment. Please try again.');
// //     } finally {
// //       setDeletingId(null);
// //     }
// //   };

// //   // Calendar functions
// //   const getDaysInMonth = (date) => {
// //     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
// //   };

// //   const getFirstDayOfMonth = (date) => {
// //     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
// //   };

// //   const handlePreviousMonth = () => {
// //     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
// //   };

// //   const handleNextMonth = () => {
// //     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
// //   };

// //   const handleDateSelect = (day) => {
// //     const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
// //     setSelectedDate(selected);
// //     setIsCalendarOpen(false);
// //   };

// //   const handleClearDate = () => {
// //     setSelectedDate(null);
// //     setIsCalendarOpen(false);
// //   };

// //   const formatDate = (date) => {
// //     if (!date) return "Select Date";
// //     return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
// //   };

// //   const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
// //   const daysInMonth = getDaysInMonth(currentMonth);
// //   const firstDay = getFirstDayOfMonth(currentMonth);
// //   const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
// //   const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

// //   // Helper function to convert paise to rupees
// //   const convertToRupees = (paise) => {
// //     return Math.round((paise / 100) * 100) / 100;
// //   };

// //   return (
// //     <div className={`subscriptions ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
// //       <PageHeader title="Subscription" showBreadcrumb={true} />

// //       {/* Header Actions */}
// //       <div className="subscriptions-actions">
// //         <div className="search-bar">
// //           <input 
// //             type="text" 
// //             placeholder="Search" 
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //           />
// //           <span className="search-icon">🔍</span>
// //         </div>
// //         <div className="filter-buttons">
// //           {/* Functional Calendar Button */}
// //           <div className="calendar-filter">
// //             <button 
// //               className="filter-button calendar-button"
// //               onClick={() => setIsCalendarOpen(!isCalendarOpen)}
// //             >
// //               <span className="filter-icon">📅</span>
// //               {formatDate(selectedDate)}
// //             </button>

// //             {/* Calendar Dropdown */}
// //             {isCalendarOpen && (
// //               <div className="calendar-dropdown">
// //                 <div className="calendar-header">
// //                   <button 
// //                     className="calendar-nav-button"
// //                     onClick={handlePreviousMonth}
// //                   >
// //                     <FaChevronLeft />
// //                   </button>
// //                   <h3 className="calendar-month-year">{monthYear}</h3>
// //                   <button 
// //                     className="calendar-nav-button"
// //                     onClick={handleNextMonth}
// //                   >
// //                     <FaChevronRight />
// //                   </button>
// //                 </div>

// //                 <div className="calendar-weekdays">
// //                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
// //                     <div key={day} className="weekday">{day}</div>
// //                   ))}
// //                 </div>

// //                 <div className="calendar-days">
// //                   {emptyDays.map((_, i) => (
// //                     <div key={`empty-${i}`} className="calendar-day empty"></div>
// //                   ))}
// //                   {days.map(day => {
// //                     const isSelected = selectedDate &&
// //                       selectedDate.getFullYear() === currentMonth.getFullYear() &&
// //                       selectedDate.getMonth() === currentMonth.getMonth() &&
// //                       selectedDate.getDate() === day;
// //                     const isToday = 
// //                       new Date().getFullYear() === currentMonth.getFullYear() &&
// //                       new Date().getMonth() === currentMonth.getMonth() &&
// //                       new Date().getDate() === day;

// //                     return (
// //                       <button
// //                         key={day}
// //                         className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
// //                         onClick={() => handleDateSelect(day)}
// //                       >
// //                         {day}
// //                       </button>
// //                     );
// //                   })}
// //                 </div>

// //                 <div className="calendar-actions">
// //                   <button 
// //                     className="calendar-clear-btn"
// //                     onClick={handleClearDate}
// //                   >
// //                     Clear
// //                   </button>
// //                 </div>
// //               </div>
// //             )}
// //           </div>

// //           <div className="filter-button total-amount-counter">
// //             <span className="currency-symbol">₹</span>
// //             <span className="animated-amount">{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</span>
// //           </div>
// //         </div>
// //       </div>

// //       {loading && <p className="loading-message">Loading payments...</p>}
// //       {error && <p className="error-message">{error}</p>}

// //       {/* Table Section */}
// //       <div className="subscriptions-table-container">
// //         <table className="subscriptions-table">
// //           <thead>
// //             <tr>
// //               <th>ID NO</th>
// //               <th>Name</th>
// //               <th>Phone Number</th>
// //               <th>Payment</th>
// //               <th>Status</th>
// //               <th>Actions</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {!loading && !error && filteredPayments.length > 0 ? (
// //               filteredPayments.map((payment, index) => {
// //                 const isDeleting = deletingId === payment.id;
// //                 // Convert paise to rupees for display
// //                 const displayPaymentAmount = convertToRupees(payment.amount);
                
// //                 return (
// //                   <tr key={payment.id || index}>
// //                     <td>{payment.id}</td>
// //                     <td>{payment.user?.name || "N/A"}</td>
// //                     <td>{payment.user?.phoneNumber || "N/A"}</td>
// //                     <td>₹{displayPaymentAmount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</td>
// //                     <td>
// //                       <span className={`status-badge ${payment.status?.toLowerCase() || 'pending'}`}>
// //                         {payment.status || 'Pending'}
// //                       </span>
// //                     </td>
// //                     <td>
// //                       <div className="action-buttons">
// //                         <a
// //                           href={`https://dashboard.razorpay.com/app/orders/${payment.razorpayOrderId}`}
// //                           target="_blank"
// //                           rel="noopener noreferrer"
// //                           className="viewbill-link"
// //                         >
// //                           Viewbill
// //                         </a>
// //                         <button
// //                           onClick={() => handleDeletePayment(payment.id, payment.user?.name)}
// //                           className="delete-payment-button"
// //                           disabled={isDeleting}
// //                           title="Delete Payment"
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
// //             ) : !loading && !error && filteredPayments.length === 0 ? (
// //               <tr>
// //                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
// //                   {searchTerm || selectedDate ? 'No payments found matching your search/date.' : 'No payments found.'}
// //                 </td>
// //               </tr>
// //             ) : null}
// //           </tbody>
// //         </table>
// //       </div>
// //     </div>
// //   );
// // }

// // export default Subscriptions;


// // // import { useState, useEffect } from "react";
// // // import { Link } from "react-router-dom";
// // // import PageHeader from '../components/PageHeader';
// // // import "../styles/Subscriptions.css";
// // // import { getAllPayments, deletePaymentById } from "../services/apiService";
// // // import { FaTrash, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// // // function Subscriptions({ isSidebarOpen }) {
// // //   const [payments, setPayments] = useState([]);
// // //   const [filteredPayments, setFilteredPayments] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState("");
// // //   const [searchTerm, setSearchTerm] = useState('');
// // //   const [deletingId, setDeletingId] = useState(null);

// // //   // Calendar state
// // //   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
// // //   const [selectedDate, setSelectedDate] = useState(null);
// // //   const [currentMonth, setCurrentMonth] = useState(new Date());

// // //   // State for service dropdown filter
// // //   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
// // //   const [selectedService, setSelectedService] = useState("All");

// // //   const serviceOptions = ["All", "Catering", "Photography", "Decoration", "Venue"];

// // //   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);

// // //   const handleServiceSelect = (value) => {
// // //     setSelectedService(value);
// // //     setIsServiceDropdownOpen(false);
// // //   };

// // //   useEffect(() => {
// // //     fetchPayments();
// // //   }, []);

// // //   const fetchPayments = async () => {
// // //     try {
// // //       setLoading(true);
// // //       setError("");
// // //       const data = await getAllPayments();
// // //       setPayments(data || []);
// // //       setFilteredPayments(data || []);
// // //     } catch (err) {
// // //       console.error("Error fetching payments:", err);
// // //       setError("Failed to load payment data");
// // //       setPayments([]);
// // //       setFilteredPayments([]);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   // Filter payments based on search, service selection, and date
// // //   useEffect(() => {
// // //     let paymentsToFilter = payments;

// // //     // Filter by service (if needed, adjust based on your payment data structure)
// // //     if (selectedService !== 'All') {
// // //       paymentsToFilter = paymentsToFilter.filter(
// // //         payment => payment.service === selectedService
// // //       );
// // //     }

// // //     // Filter by selected date
// // //     if (selectedDate) {
// // //       paymentsToFilter = paymentsToFilter.filter(payment => {
// // //         const paymentDate = new Date(payment.createdAt);
// // //         return (
// // //           paymentDate.getFullYear() === selectedDate.getFullYear() &&
// // //           paymentDate.getMonth() === selectedDate.getMonth() &&
// // //           paymentDate.getDate() === selectedDate.getDate()
// // //         );
// // //       });
// // //     }

// // //     // Filter by search term
// // //     if (searchTerm) {
// // //       paymentsToFilter = paymentsToFilter.filter(payment =>
// // //         payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //         payment.user?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //         payment.id?.toString().includes(searchTerm)
// // //       );
// // //     }

// // //     setFilteredPayments(paymentsToFilter);
// // //   }, [selectedService, searchTerm, payments, selectedDate]);

// // //   const handleDeletePayment = async (paymentId, paymentName) => {
// // //     if (!window.confirm(`Are you sure you want to delete payment for "${paymentName}"? This action cannot be undone.`)) {
// // //       return;
// // //     }

// // //     setDeletingId(paymentId);
// // //     setError("");

// // //     try {
// // //       await deletePaymentById(paymentId);
      
// // //       setPayments(prevPayments => 
// // //         prevPayments.filter(payment => payment.id !== paymentId)
// // //       );
// // //       setFilteredPayments(prevPayments => 
// // //         prevPayments.filter(payment => payment.id !== paymentId)
// // //       );

// // //       console.log(`Payment ${paymentId} deleted successfully`);
// // //     } catch (err) {
// // //       console.error(`Failed to delete payment ${paymentId}:`, err);
// // //       setError(err.message || 'Failed to delete payment. Please try again.');
// // //     } finally {
// // //       setDeletingId(null);
// // //     }
// // //   };

// // //   // Calendar functions
// // //   const getDaysInMonth = (date) => {
// // //     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
// // //   };

// // //   const getFirstDayOfMonth = (date) => {
// // //     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
// // //   };

// // //   const handlePreviousMonth = () => {
// // //     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
// // //   };

// // //   const handleNextMonth = () => {
// // //     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
// // //   };

// // //   const handleDateSelect = (day) => {
// // //     const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
// // //     setSelectedDate(selected);
// // //     setIsCalendarOpen(false);
// // //   };

// // //   const handleClearDate = () => {
// // //     setSelectedDate(null);
// // //     setIsCalendarOpen(false);
// // //   };

// // //   const formatDate = (date) => {
// // //     if (!date) return "Select Date";
// // //     return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
// // //   };

// // //   const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
// // //   const daysInMonth = getDaysInMonth(currentMonth);
// // //   const firstDay = getFirstDayOfMonth(currentMonth);
// // //   const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
// // //   const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

// // //   return (
// // //     <div className={`subscriptions ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
// // //       <PageHeader title="Subscription" showBreadcrumb={true} />

// // //       {/* Header Actions */}
// // //       <div className="subscriptions-actions">
// // //         <div className="search-bar">
// // //           <input 
// // //             type="text" 
// // //             placeholder="Search" 
// // //             value={searchTerm}
// // //             onChange={(e) => setSearchTerm(e.target.value)}
// // //           />
// // //           <span className="search-icon">🔍</span>
// // //         </div>
// // //         <div className="filter-buttons">
// // //           {/* Functional Calendar Button */}
// // //           <div className="calendar-filter">
// // //             <button 
// // //               className="filter-button calendar-button"
// // //               onClick={() => setIsCalendarOpen(!isCalendarOpen)}
// // //             >
// // //               <span className="filter-icon">📅</span>
// // //               {formatDate(selectedDate)}
// // //             </button>

// // //             {/* Calendar Dropdown */}
// // //             {isCalendarOpen && (
// // //               <div className="calendar-dropdown">
// // //                 <div className="calendar-header">
// // //                   <button 
// // //                     className="calendar-nav-button"
// // //                     onClick={handlePreviousMonth}
// // //                   >
// // //                     <FaChevronLeft />
// // //                   </button>
// // //                   <h3 className="calendar-month-year">{monthYear}</h3>
// // //                   <button 
// // //                     className="calendar-nav-button"
// // //                     onClick={handleNextMonth}
// // //                   >
// // //                     <FaChevronRight />
// // //                   </button>
// // //                 </div>

// // //                 <div className="calendar-weekdays">
// // //                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
// // //                     <div key={day} className="weekday">{day}</div>
// // //                   ))}
// // //                 </div>

// // //                 <div className="calendar-days">
// // //                   {emptyDays.map((_, i) => (
// // //                     <div key={`empty-${i}`} className="calendar-day empty"></div>
// // //                   ))}
// // //                   {days.map(day => {
// // //                     const isSelected = selectedDate &&
// // //                       selectedDate.getFullYear() === currentMonth.getFullYear() &&
// // //                       selectedDate.getMonth() === currentMonth.getMonth() &&
// // //                       selectedDate.getDate() === day;
// // //                     const isToday = 
// // //                       new Date().getFullYear() === currentMonth.getFullYear() &&
// // //                       new Date().getMonth() === currentMonth.getMonth() &&
// // //                       new Date().getDate() === day;

// // //                     return (
// // //                       <button
// // //                         key={day}
// // //                         className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
// // //                         onClick={() => handleDateSelect(day)}
// // //                       >
// // //                         {day}
// // //                       </button>
// // //                     );
// // //                   })}
// // //                 </div>

// // //                 <div className="calendar-actions">
// // //                   <button 
// // //                     className="calendar-clear-btn"
// // //                     onClick={handleClearDate}
// // //                   >
// // //                     Clear
// // //                   </button>
// // //                 </div>
// // //               </div>
// // //             )}
// // //           </div>

// // //           <div className="filter-button">
// // //             ₹{filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString('en-IN')}
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {loading && <p className="loading-message">Loading payments...</p>}
// // //       {error && <p className="error-message">{error}</p>}

// // //       {/* Table Section */}
// // //       <div className="subscriptions-table-container">
// // //         <table className="subscriptions-table">
// // //           <thead>
// // //             <tr>
// // //               <th>ID NO</th>
// // //               <th>Name</th>
// // //               <th>Phone Number</th>
// // //               <th>Payment</th>
// // //               <th>Status</th>
// // //               <th>Actions</th>
// // //             </tr>
// // //           </thead>
// // //           <tbody>
// // //             {!loading && !error && filteredPayments.length > 0 ? (
// // //               filteredPayments.map((payment, index) => {
// // //                 const isDeleting = deletingId === payment.id;
// // //                 return (
// // //                   <tr key={payment.id || index}>
// // //                     <td>{payment.id}</td>
// // //                     <td>{payment.user?.name || "N/A"}</td>
// // //                     <td>{payment.user?.phoneNumber || "N/A"}</td>
// // //                     <td>₹{payment.amount}</td>
// // //                     <td>
// // //                       <span className={`status-badge ${payment.status?.toLowerCase() || 'pending'}`}>
// // //                         {payment.status || 'Pending'}
// // //                       </span>
// // //                     </td>
// // //                     <td>
// // //                       <div className="action-buttons">
// // //                         <a
// // //                           href={`https://dashboard.razorpay.com/app/orders/${payment.razorpayOrderId}`}
// // //                           target="_blank"
// // //                           rel="noopener noreferrer"
// // //                           className="viewbill-link"
// // //                         >
// // //                           Viewbill
// // //                         </a>
// // //                         <button
// // //                           onClick={() => handleDeletePayment(payment.id, payment.user?.name)}
// // //                           className="delete-payment-button"
// // //                           disabled={isDeleting}
// // //                           title="Delete Payment"
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
// // //             ) : !loading && !error && filteredPayments.length === 0 ? (
// // //               <tr>
// // //                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
// // //                   {searchTerm || selectedDate ? 'No payments found matching your search/date.' : 'No payments found.'}
// // //                 </td>
// // //               </tr>
// // //             ) : null}
// // //           </tbody>
// // //         </table>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // export default Subscriptions;

// // // // import { useState, useEffect } from "react";
// // // // import { Link } from "react-router-dom";
// // // // import PageHeader from '../components/PageHeader';
// // // // import "../styles/Subscriptions.css";
// // // // import { getAllPayments, deletePaymentById } from "../services/apiService";
// // // // import { FaTrash, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// // // // function Subscriptions({ isSidebarOpen }) {
// // // //   const [payments, setPayments] = useState([]);
// // // //   const [filteredPayments, setFilteredPayments] = useState([]);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [error, setError] = useState("");
// // // //   const [searchTerm, setSearchTerm] = useState('');
// // // //   const [deletingId, setDeletingId] = useState(null);

// // // //   // Calendar state
// // // //   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
// // // //   const [selectedDate, setSelectedDate] = useState(null);
// // // //   const [currentMonth, setCurrentMonth] = useState(new Date());

// // // //   // State for service dropdown filter
// // // //   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
// // // //   const [selectedService, setSelectedService] = useState("All");

// // // //   const serviceOptions = ["All", "Catering", "Photography", "Decoration", "Venue"];

// // // //   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);

// // // //   const handleServiceSelect = (value) => {
// // // //     setSelectedService(value);
// // // //     setIsServiceDropdownOpen(false);
// // // //   };

// // // //   useEffect(() => {
// // // //     fetchPayments();
// // // //   }, []);

// // // //   const fetchPayments = async () => {
// // // //     try {
// // // //       setLoading(true);
// // // //       setError("");
// // // //       const data = await getAllPayments();
// // // //       setPayments(data || []);
// // // //       setFilteredPayments(data || []);
// // // //     } catch (err) {
// // // //       console.error("Error fetching payments:", err);
// // // //       setError("Failed to load payment data");
// // // //       setPayments([]);
// // // //       setFilteredPayments([]);
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // Filter payments based on search, service selection, and date
// // // //   useEffect(() => {
// // // //     let paymentsToFilter = payments;

// // // //     // Filter by service (if needed, adjust based on your payment data structure)
// // // //     if (selectedService !== 'All') {
// // // //       paymentsToFilter = paymentsToFilter.filter(
// // // //         payment => payment.service === selectedService
// // // //       );
// // // //     }

// // // //     // Filter by selected date
// // // //     if (selectedDate) {
// // // //       paymentsToFilter = paymentsToFilter.filter(payment => {
// // // //         const paymentDate = new Date(payment.createdAt);
// // // //         return (
// // // //           paymentDate.getFullYear() === selectedDate.getFullYear() &&
// // // //           paymentDate.getMonth() === selectedDate.getMonth() &&
// // // //           paymentDate.getDate() === selectedDate.getDate()
// // // //         );
// // // //       });
// // // //     }

// // // //     // Filter by search term
// // // //     if (searchTerm) {
// // // //       paymentsToFilter = paymentsToFilter.filter(payment =>
// // // //         payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // // //         payment.user?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // // //         payment.id?.toString().includes(searchTerm)
// // // //       );
// // // //     }

// // // //     setFilteredPayments(paymentsToFilter);
// // // //   }, [selectedService, searchTerm, payments, selectedDate]);

// // // //   const handleDeletePayment = async (paymentId, paymentName) => {
// // // //     if (!window.confirm(`Are you sure you want to delete payment for "${paymentName}"? This action cannot be undone.`)) {
// // // //       return;
// // // //     }

// // // //     setDeletingId(paymentId);
// // // //     setError("");

// // // //     try {
// // // //       await deletePaymentById(paymentId);
      
// // // //       setPayments(prevPayments => 
// // // //         prevPayments.filter(payment => payment.id !== paymentId)
// // // //       );
// // // //       setFilteredPayments(prevPayments => 
// // // //         prevPayments.filter(payment => payment.id !== paymentId)
// // // //       );

// // // //       console.log(`Payment ${paymentId} deleted successfully`);
// // // //     } catch (err) {
// // // //       console.error(`Failed to delete payment ${paymentId}:`, err);
// // // //       setError(err.message || 'Failed to delete payment. Please try again.');
// // // //     } finally {
// // // //       setDeletingId(null);
// // // //     }
// // // //   };

// // // //   // Calendar functions
// // // //   const getDaysInMonth = (date) => {
// // // //     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
// // // //   };

// // // //   const getFirstDayOfMonth = (date) => {
// // // //     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
// // // //   };

// // // //   const handlePreviousMonth = () => {
// // // //     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
// // // //   };

// // // //   const handleNextMonth = () => {
// // // //     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
// // // //   };

// // // //   const handleDateSelect = (day) => {
// // // //     const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
// // // //     setSelectedDate(selected);
// // // //     setIsCalendarOpen(false);
// // // //   };

// // // //   const handleClearDate = () => {
// // // //     setSelectedDate(null);
// // // //     setIsCalendarOpen(false);
// // // //   };

// // // //   const formatDate = (date) => {
// // // //     if (!date) return "Select Date";
// // // //     return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
// // // //   };

// // // //   const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
// // // //   const daysInMonth = getDaysInMonth(currentMonth);
// // // //   const firstDay = getFirstDayOfMonth(currentMonth);
// // // //   const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
// // // //   const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

// // // //   return (
// // // //     <div className={`subscriptions ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
// // // //       <PageHeader title="Subscription" showBreadcrumb={true} />

// // // //       {/* Header Actions */}
// // // //       <div className="subscriptions-actions">
// // // //         <div className="search-bar">
// // // //           <input 
// // // //             type="text" 
// // // //             placeholder="Search" 
// // // //             value={searchTerm}
// // // //             onChange={(e) => setSearchTerm(e.target.value)}
// // // //           />
// // // //           <span className="search-icon">🔍</span>
// // // //         </div>
// // // //         <div className="filter-buttons">
// // // //           {/* Functional Calendar Button */}
// // // //           <div className="calendar-filter">
// // // //             <button 
// // // //               className="filter-button calendar-button"
// // // //               onClick={() => setIsCalendarOpen(!isCalendarOpen)}
// // // //             >
// // // //               <span className="filter-icon">📅</span>
// // // //               {formatDate(selectedDate)}
// // // //             </button>

// // // //             {/* Calendar Dropdown */}
// // // //             {isCalendarOpen && (
// // // //               <div className="calendar-dropdown">
// // // //                 <div className="calendar-header">
// // // //                   <button 
// // // //                     className="calendar-nav-button"
// // // //                     onClick={handlePreviousMonth}
// // // //                   >
// // // //                     <FaChevronLeft />
// // // //                   </button>
// // // //                   <h3 className="calendar-month-year">{monthYear}</h3>
// // // //                   <button 
// // // //                     className="calendar-nav-button"
// // // //                     onClick={handleNextMonth}
// // // //                   >
// // // //                     <FaChevronRight />
// // // //                   </button>
// // // //                 </div>

// // // //                 <div className="calendar-weekdays">
// // // //                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
// // // //                     <div key={day} className="weekday">{day}</div>
// // // //                   ))}
// // // //                 </div>

// // // //                 <div className="calendar-days">
// // // //                   {emptyDays.map((_, i) => (
// // // //                     <div key={`empty-${i}`} className="calendar-day empty"></div>
// // // //                   ))}
// // // //                   {days.map(day => {
// // // //                     const isSelected = selectedDate &&
// // // //                       selectedDate.getFullYear() === currentMonth.getFullYear() &&
// // // //                       selectedDate.getMonth() === currentMonth.getMonth() &&
// // // //                       selectedDate.getDate() === day;
// // // //                     const isToday = 
// // // //                       new Date().getFullYear() === currentMonth.getFullYear() &&
// // // //                       new Date().getMonth() === currentMonth.getMonth() &&
// // // //                       new Date().getDate() === day;

// // // //                     return (
// // // //                       <button
// // // //                         key={day}
// // // //                         className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
// // // //                         onClick={() => handleDateSelect(day)}
// // // //                       >
// // // //                         {day}
// // // //                       </button>
// // // //                     );
// // // //                   })}
// // // //                 </div>

// // // //                 <div className="calendar-actions">
// // // //                   <button 
// // // //                     className="calendar-clear-btn"
// // // //                     onClick={handleClearDate}
// // // //                   >
// // // //                     Clear
// // // //                   </button>
// // // //                 </div>
// // // //               </div>
// // // //             )}
// // // //           </div>

// // // //           <div className="filter-button">
// // // //             ₹{filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString('en-IN')}
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {loading && <p className="loading-message">Loading payments...</p>}
// // // //       {error && <p className="error-message">{error}</p>}

// // // //       {/* Table Section */}
// // // //       <div className="subscriptions-table-container">
// // // //         <table className="subscriptions-table">
// // // //           <thead>
// // // //             <tr>
// // // //               <th>ID NO</th>
// // // //               <th>Name</th>
// // // //               <th>Phone Number</th>
// // // //               <th>Payment</th>
// // // //               <th>Status</th>
// // // //               <th>Actions</th>
// // // //             </tr>
// // // //           </thead>
// // // //           <tbody>
// // // //             {!loading && !error && filteredPayments.length > 0 ? (
// // // //               filteredPayments.map((payment, index) => {
// // // //                 const isDeleting = deletingId === payment.id;
// // // //                 return (
// // // //                   <tr key={payment.id || index}>
// // // //                     <td>{payment.id}</td>
// // // //                     <td>{payment.user?.name || "N/A"}</td>
// // // //                     <td>{payment.user?.phoneNumber || "N/A"}</td>
// // // //                     <td>₹{payment.amount}</td>
// // // //                     <td>
// // // //                       <span className={`status-badge ${payment.status?.toLowerCase() || 'pending'}`}>
// // // //                         {payment.status || 'Pending'}
// // // //                       </span>
// // // //                     </td>
// // // //                     <td>
// // // //                       <div className="action-buttons">
// // // //                         <Link
// // // //                           to="/view-bill"
// // // //                           state={{
// // // //                             billData: {
// // // //                               payment_id: payment.razorpayPaymentId,
// // // //                               amount: payment.amount * 100,
// // // //                               currency: "INR",
// // // //                               status: payment.status?.toLowerCase() || 'pending',
// // // //                               created_at: new Date(payment.createdAt).getTime() / 1000,
// // // //                               method: "razorpay",
// // // //                               email: `${payment.user?.name?.toLowerCase().replace(" ", "")}@gmail.com`,
// // // //                               contact: payment.user?.phoneNumber,
// // // //                               description: `Payment by ${payment.user?.name}`,
// // // //                             },
// // // //                           }}
// // // //                           className="viewbill-link"
// // // //                         >
// // // //                           Viewbill
// // // //                         </Link>
// // // //                         <button
// // // //                           onClick={() => handleDeletePayment(payment.id, payment.user?.name)}
// // // //                           className="delete-payment-button"
// // // //                           disabled={isDeleting}
// // // //                           title="Delete Payment"
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
// // // //             ) : !loading && !error && filteredPayments.length === 0 ? (
// // // //               <tr>
// // // //                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
// // // //                   {searchTerm || selectedDate ? 'No payments found matching your search/date.' : 'No payments found.'}
// // // //                 </td>
// // // //               </tr>
// // // //             ) : null}
// // // //           </tbody>
// // // //         </table>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // // export default Subscriptions;

// // // // import { useState, useEffect } from "react";
// // // // import { Link } from "react-router-dom";
// // // // import PageHeader from '../components/PageHeader';
// // // // import "../styles/Subscriptions.css";
// // // // import { getAllPayments, deletePaymentById } from "../services/apiService";
// // // // import { FaTrash, FaSpinner } from 'react-icons/fa';

// // // // function Subscriptions({ isSidebarOpen }) {
// // // //   const [payments, setPayments] = useState([]);
// // // //   const [filteredPayments, setFilteredPayments] = useState([]);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [error, setError] = useState("");
// // // //   const [searchTerm, setSearchTerm] = useState('');
// // // //   const [deletingId, setDeletingId] = useState(null);

// // // //   // State for service dropdown filter
// // // //   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
// // // //   const [selectedService, setSelectedService] = useState("All");

// // // //   const serviceOptions = ["All", "Catering", "Photography", "Decoration", "Venue"];

// // // //   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);

// // // //   const handleServiceSelect = (value) => {
// // // //     setSelectedService(value);
// // // //     setIsServiceDropdownOpen(false);
// // // //   };

// // // //   useEffect(() => {
// // // //     fetchPayments();
// // // //   }, []);

// // // //   const fetchPayments = async () => {
// // // //     try {
// // // //       setLoading(true);
// // // //       setError("");
// // // //       const data = await getAllPayments();
// // // //       setPayments(data || []);
// // // //       setFilteredPayments(data || []);
// // // //     } catch (err) {
// // // //       console.error("Error fetching payments:", err);
// // // //       setError("Failed to load payment data");
// // // //       setPayments([]);
// // // //       setFilteredPayments([]);
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // Filter payments based on search and service selection
// // // //   useEffect(() => {
// // // //     let paymentsToFilter = payments;

// // // //     // Filter by service (if needed, adjust based on your payment data structure)
// // // //     if (selectedService !== 'All') {
// // // //       // Assuming payment has a service field, adjust as needed
// // // //       paymentsToFilter = paymentsToFilter.filter(
// // // //         payment => payment.service === selectedService
// // // //       );
// // // //     }

// // // //     // Filter by search term
// // // //     if (searchTerm) {
// // // //       paymentsToFilter = paymentsToFilter.filter(payment =>
// // // //         payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // // //         payment.user?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // // //         payment.id?.toString().includes(searchTerm)
// // // //       );
// // // //     }

// // // //     setFilteredPayments(paymentsToFilter);
// // // //   }, [selectedService, searchTerm, payments]);

// // // //   const handleDeletePayment = async (paymentId, paymentName) => {
// // // //     if (!window.confirm(`Are you sure you want to delete payment for "${paymentName}"? This action cannot be undone.`)) {
// // // //       return;
// // // //     }

// // // //     setDeletingId(paymentId);
// // // //     setError("");

// // // //     try {
// // // //       await deletePaymentById(paymentId);
      
// // // //       // Remove from local state
// // // //       setPayments(prevPayments => 
// // // //         prevPayments.filter(payment => payment.id !== paymentId)
// // // //       );
// // // //       setFilteredPayments(prevPayments => 
// // // //         prevPayments.filter(payment => payment.id !== paymentId)
// // // //       );

// // // //       console.log(`Payment ${paymentId} deleted successfully`);
// // // //     } catch (err) {
// // // //       console.error(`Failed to delete payment ${paymentId}:`, err);
// // // //       setError(err.message || 'Failed to delete payment. Please try again.');
// // // //     } finally {
// // // //       setDeletingId(null);
// // // //     }
// // // //   };

// // // //   return (
// // // //     <div className={`subscriptions ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
// // // //       <PageHeader title="Subscription" showBreadcrumb={true} />

// // // //       {/* Header Actions */}
// // // //       <div className="subscriptions-actions">
// // // //         <div className="search-bar">
// // // //           <input 
// // // //             type="text" 
// // // //             placeholder="Search" 
// // // //             value={searchTerm}
// // // //             onChange={(e) => setSearchTerm(e.target.value)}
// // // //           />
// // // //           <span className="search-icon">🔍</span>
// // // //         </div>
// // // //         <div className="filter-buttons">
// // // //           <div className="filter-button">
// // // //             <span className="filter-icon">📅</span> Today
// // // //           </div>
// // // //           <div className="filter-button">
// // // //             ₹508300
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {loading && <p className="loading-message">Loading payments...</p>}
// // // //       {error && <p className="error-message">{error}</p>}

// // // //       {/* Table Section */}
// // // //       <div className="subscriptions-table-container">
// // // //         <table className="subscriptions-table">
// // // //           <thead>
// // // //             <tr>
// // // //               <th>ID NO</th>
// // // //               <th>Name</th>
// // // //               <th>Phone Number</th>
// // // //               <th>Payment</th>
// // // //               <th>Status</th>
// // // //               <th>Actions</th>
// // // //             </tr>
// // // //           </thead>
// // // //           <tbody>
// // // //             {!loading && !error && filteredPayments.length > 0 ? (
// // // //               filteredPayments.map((payment, index) => {
// // // //                 const isDeleting = deletingId === payment.id;
// // // //                 return (
// // // //                   <tr key={payment.id || index}>
// // // //                     <td>{payment.id}</td>
// // // //                     <td>{payment.user?.name || "N/A"}</td>
// // // //                     <td>{payment.user?.phoneNumber || "N/A"}</td>
// // // //                     <td>₹{payment.amount}</td>
// // // //                     <td>
// // // //                       <span className={`status-badge ${payment.status?.toLowerCase() || 'pending'}`}>
// // // //                         {payment.status || 'Pending'}
// // // //                       </span>
// // // //                     </td>
// // // //                     <td>
// // // //                       <div className="action-buttons">
// // // //                         <Link
// // // //                           to="/view-bill"
// // // //                           state={{
// // // //                             billData: {
// // // //                               payment_id: payment.razorpayPaymentId,
// // // //                               amount: payment.amount * 100,
// // // //                               currency: "INR",
// // // //                               status: payment.status?.toLowerCase() || 'pending',
// // // //                               created_at: new Date(payment.createdAt).getTime() / 1000,
// // // //                               method: "razorpay",
// // // //                               email: `${payment.user?.name?.toLowerCase().replace(" ", "")}@gmail.com`,
// // // //                               contact: payment.user?.phoneNumber,
// // // //                               description: `Payment by ${payment.user?.name}`,
// // // //                             },
// // // //                           }}
// // // //                           className="viewbill-link"
// // // //                         >
// // // //                           Viewbill
// // // //                         </Link>
// // // //                         <button
// // // //                           onClick={() => handleDeletePayment(payment.id, payment.user?.name)}
// // // //                           className="delete-payment-button"
// // // //                           disabled={isDeleting}
// // // //                           title="Delete Payment"
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
// // // //             ) : !loading && !error && filteredPayments.length === 0 ? (
// // // //               <tr>
// // // //                 <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
// // // //                   {searchTerm ? 'No payments found matching your search.' : 'No payments found.'}
// // // //                 </td>
// // // //               </tr>
// // // //             ) : null}
// // // //           </tbody>
// // // //         </table>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // // export default Subscriptions;

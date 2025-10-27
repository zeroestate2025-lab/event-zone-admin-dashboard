// src/pages/Subscriptions.js
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Subscriptions.css";
import { getAllPayments } from "../services/apiService";

function Subscriptions({ isSidebarOpen }) {
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const serviceOptions = ["All", "Catering", "Photography", "Decoration"];
  const statusOptions = ["All", "Paid", "Unpaid", "Pending"];

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

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await getAllPayments();
        setPayments(data);
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className={`subscriptions ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* Header Section */}
      <div className="subscriptions-header">
        <div className="header-left">
          {/* <span className="back-arrow">←</span> */}
          <h1>Subscriptions</h1>
        </div>
        <div className="header-right">
          {/* <div className="search-bar">
            <input type="text" placeholder="Search" />
            <span className="search-icon">🔍</span>
          </div> */}
          {/* <div className="date-dropdown">
            <span className="date-text">Today</span>
            <span className="dropdown-arrow">▼</span>
          </div> */}
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        {loading ? (
          <p>Loading payments...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <table className="subscriptions-table">
            <thead>
              <tr>
                <th>ID NO</th>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Viewbill</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={index} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                  <td>{payment.id}</td>
                  <td>{payment.user?.name || "N/A"}</td>
                  <td>{payment.user?.phoneNumber || "N/A"}</td>
                  <td>₹{payment.amount}</td>
                  <td>{payment.status}</td>
                  <td>
                    <Link
                      to="/view-bill"
                      state={{
                        billData: {
                          payment_id: payment.razorpayPaymentId,
                          amount: payment.amount * 100,
                          currency: "INR",
                          status: payment.status.toLowerCase(),
                          created_at: new Date(payment.createdAt).getTime() / 1000,
                          method: "razorpay",
                          email: `${payment.user?.name?.toLowerCase().replace(" ", "")}@gmail.com`,
                          contact: payment.user?.phoneNumber,
                          description: `Payment by ${payment.user?.name}`,
                        },
                      }}
                      className="viewbill-link"
                    >
                      Viewbill
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Subscriptions;

// import { useState } from 'react';
// import { Link } from 'react-router-dom';
// import '../styles/Subscriptions.css';

// function Subscriptions({ isSidebarOpen }) {
//   // State for dropdowns in headers
//   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
//   const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
//   const [selectedService, setSelectedService] = useState('Catering');
//   const [selectedStatus, setSelectedStatus] = useState('Paid');

//   // Options for dropdowns
//   const serviceOptions = ['All', 'Catering', 'Photography', 'Decoration'];
//   const statusOptions = ['Paid', 'Unpaid', 'Pending'];

//   // Toggle dropdown visibility
//   const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);
//   const toggleStatusDropdown = () => setIsStatusDropdownOpen(!isStatusDropdownOpen);

//   // Handle selection of options
//   const handleServiceSelect = (value) => {
//     setSelectedService(value);
//     setIsServiceDropdownOpen(false);
//   };
//   const handleStatusSelect = (value) => {
//     setSelectedStatus(value);
//     setIsStatusDropdownOpen(false);
//   };

//   // Static data for subscribed users (replace with API data)
//   const subscribedUsers = [
//     { id: 'IOHOO', name: 'John', service: 'Catering', phone: '9878987654', payment: 'PhonePe', plan: '3 Months', status: 'Paid' },
//     { id: 'IOHO1', name: 'John Events', service: 'Catering', phone: '9878987654', payment: 'PhonePe', plan: '3 Months', status: 'Paid' },
//     { id: 'IOHO2', name: 'John Events', service: 'Catering', phone: '9878987654', payment: 'PhonePe', plan: '3 Months', status: 'Paid' },
//     { id: 'IOHO3', name: 'John Events', service: 'Catering', phone: '9878987654', payment: 'PhonePe', plan: '3 Months', status: 'Paid' },
//     { id: 'IOHO4', name: 'John Events', service: 'Catering', phone: '9878987654', payment: 'PhonePe', plan: '3 Months', status: 'Paid' },
//   ];

//   return (
//     <div className={`subscriptions ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//       {/* Header Section */}
//       <div className="subscriptions-header">
//         <div className="header-left">
//           <span className="back-arrow">←</span>
//           <h1>Subscriptions</h1>
//         </div>
//         <div className="header-right">
//           <div className="search-bar">
//             <input type="text" placeholder="Search" />
//             <span className="search-icon">🔍</span>
//           </div>
//           <div className="date-dropdown">
//             <span onClick={() => {}} className="date-text">Today</span>
//             <span className="dropdown-arrow">▼</span>
//           </div>
//         </div>
//       </div>

//       {/* Table Section */}
//       <div className="table-container">
//         <table className="subscriptions-table">
//           <thead>
//             <tr>
//               <th>ID NO</th>
//               <th>Name</th>
//               <th>Phone Number</th>
//               <th>Payment</th>
//               <th>Status</th>
//               <th>Viewbill</th>
//             </tr>
//           </thead>
//           <tbody>
//             {subscribedUsers.map((user, index) => (
//               <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
//                 <td>{user.id}</td>
//                 <td>{user.name}</td>
//                 <td>{user.phone}</td>
//                 <td>{user.payment}</td>
//                 <td>{user.status}</td>
//                 <td>
//                   <Link
//                     to="/view-bill"
//                     state={{
//                       billData: {
//                         payment_id: `pay_${user.id}`,
//                         amount: 2900, // Razorpay amount in paisa (replace with actual amount)
//                         currency: 'INR',
//                         status: user.status.toLowerCase(),
//                         created_at: 1696118400, // Replace with actual timestamp
//                         method: user.payment.toLowerCase(),
//                         email: `${user.name.toLowerCase().replace(' ', '')}@gmail.com`,
//                         contact: user.phone,
//                         description: `Payment for ${user.plan} Plan`,
//                       },
//                     }}
//                     className="viewbill-link"
//                   >
//                     Viewbill
//                   </Link>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default Subscriptions;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from '../components/PageHeader';
import "../styles/Subscriptions.css";
import { getAllPayments, deletePaymentById } from "../services/apiService";
import { FaTrash, FaSpinner } from 'react-icons/fa';

function Subscriptions({ isSidebarOpen }) {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // State for service dropdown filter
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("All");

  const serviceOptions = ["All", "Catering", "Photography", "Decoration", "Venue"];

  const toggleServiceDropdown = () => setIsServiceDropdownOpen(!isServiceDropdownOpen);

  const handleServiceSelect = (value) => {
    setSelectedService(value);
    setIsServiceDropdownOpen(false);
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

  // Filter payments based on search and service selection
  useEffect(() => {
    let paymentsToFilter = payments;

    // Filter by service (if needed, adjust based on your payment data structure)
    if (selectedService !== 'All') {
      // Assuming payment has a service field, adjust as needed
      paymentsToFilter = paymentsToFilter.filter(
        payment => payment.service === selectedService
      );
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
  }, [selectedService, searchTerm, payments]);

  const handleDeletePayment = async (paymentId, paymentName) => {
    if (!window.confirm(`Are you sure you want to delete payment for "${paymentName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(paymentId);
    setError("");

    try {
      await deletePaymentById(paymentId);
      
      // Remove from local state
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

  return (
    <div className={`subscriptions ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <PageHeader title="Subscription" showBreadcrumb={true} />

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
          <div className="filter-button">
            <span className="filter-icon">📅</span> Today
          </div>
          <div className="filter-button">
            ₹508300
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
                return (
                  <tr key={payment.id || index}>
                    <td>{payment.id}</td>
                    <td>{payment.user?.name || "N/A"}</td>
                    <td>{payment.user?.phoneNumber || "N/A"}</td>
                    <td>₹{payment.amount}</td>
                    <td>
                      <span className={`status-badge ${payment.status?.toLowerCase() || 'pending'}`}>
                        {payment.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to="/view-bill"
                          state={{
                            billData: {
                              payment_id: payment.razorpayPaymentId,
                              amount: payment.amount * 100,
                              currency: "INR",
                              status: payment.status?.toLowerCase() || 'pending',
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
                  {searchTerm ? 'No payments found matching your search.' : 'No payments found.'}
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

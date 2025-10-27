import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './ViewDetails.css';

function ViewDetails() {
  const location = useLocation();
  const data = location.state?.data || {
    proprietorName: 'John',
    email: 'john@gmail.com',
    businessName: 'John\'s Catering',
    service: 'Catering',
    phoneNumber: '1234567890',
    state: 'Tamilnadu',
    district: 'Coimbatore',
    location: '12/1 Avinashi Road, Coimbatore',
    plan: '29/Month',
    paymentStatus: 'Paid',
    paymentMode: 'Gpay',
  };

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    businessName: data.businessName || '',
    service: data.service || '',
    price: data.price || '',
    phoneNumber: data.phoneNumber || '',
    address: data.address || '',
    moreDetails: data.moreDetails || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setEditMode(false);
    // Add logic to save formData to backend if needed
  };

  // Simulated Razorpay payment data to pass to ViewBill
  const billData = {
    payment_id: 'pay_1234567890',
    amount: 2900, // Razorpay amount is in paisa (e.g., 2900 paisa = 29.00 INR)
    currency: 'INR',
    status: 'captured',
    created_at: 1696118400, // Unix timestamp
    method: 'upi',
    email: data.email,
    contact: data.phoneNumber,
    description: `Payment for ${data.plan} Plan`,
  };

  return (
    <div className="view-details-container">
      <div className="view-details-header">
        <h2>Evnazon</h2>
        <button className="close-button" onClick={() => window.history.back()}>×</button>
      </div>
      <div className="details-section">
        <div className="detail-row">
          <span>Proprietor Name</span>
          <span>{data.proprietorName}</span>
        </div>
        <div className="detail-row">
          <span>Email</span>
          <span>{data.email}</span>
        </div>
        <div className="detail-row">
          <span>Business Name</span>
          <span>{data.businessName}</span>
        </div>
        <div className="detail-row">
          <span>Service</span>
          <span>{data.service}</span>
        </div>
        <div className="detail-row">
          <span>Phone Number</span>
          <span>{data.phoneNumber}</span>
        </div>
        <div className="detail-row">
          <span>State</span>
          <span>{data.state}</span>
        </div>
        <div className="detail-row">
          <span>District</span>
          <span>{data.district}</span>
        </div>
        <div className="detail-row">
          <span>Location</span>
          <span>{data.location}</span>
        </div>
      </div>
      <div className="payment-section">
        <div className="payment-row">
          <span>Plan</span>
          <span>{data.plan}</span>
        </div>
        <div className="payment-row">
          <span>Payment Status</span>
          <span>{data.paymentStatus}</span>
        </div>
        <div className="payment-row">
          <span>Payment Mode</span>
          <span>{data.paymentMode}</span>
        </div>
        <Link to="/view-bill" state={{ billData }} className="view-bill-button">
          VIEW BILL
        </Link>
      </div>
      <div className="edit-section">
        <h3>Edit Details</h3>
        {editMode ? (
          <div className="edit-form">
            <div className="form-row">
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Business Name *"
              />
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                placeholder="Service *"
              />
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Price *"
              />
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Phone Number *"
              />
            </div>
            <div className="form-row">
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address :"
              />
            </div>
            <div className="form-row">
              <textarea
                name="moreDetails"
                value={formData.moreDetails}
                onChange={handleInputChange}
                placeholder="More Details:"
              />
            </div>
            <button className="save-button" onClick={handleSave}>Save</button>
          </div>
        ) : (
          <button className="edit-button" onClick={() => setEditMode(true)}>Edit</button>
        )}
      </div>
      <div className="image-section">
        <div className="image-placeholder" />
        <div className="image-placeholder" />
        <div className="image-placeholder" />
        <div className="image-placeholder" />
        <div className="image-placeholder" />
        <button className="upload-button">Upload Image</button>
        <button className="activate-button" onClick={() => alert('User activated!')}>
          Activate
        </button>
      </div>
    </div>
  );
}

export default ViewDetails;
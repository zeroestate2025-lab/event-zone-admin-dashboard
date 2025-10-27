import { useState, useEffect } from 'react';
import { getAllPromotions, addPromotion, deletePromotionById } from '../services/apiService'; // API calls uncommented
import { IoMdAddCircleOutline } from 'react-icons/io'; // Import an icon for adding
import '../styles/Promotions.css'; // Import the new CSS file
import { FaTrash } from 'react-icons/fa'; // Import trash icon for delete


function Promotions({ isSidebarOpen }) {
  const [promotions, setPromotions] = useState([]); // Initialize with empty array for API data
  const [loading, setLoading] = useState(true); // Set loading to true initially
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPromotionData, setNewPromotionData] = useState({
    businessId: '',
    position: '',
    // Add other fields your API expects for a new promotion, e.g., title, description, dates
    // For now, assuming isApproved is handled by backend or defaults
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // For add form submission
  const [deletingItemId, setDeletingItemId] = useState(null); // To track which item is being deleted


  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPromotions();
      setPromotions(data || []);
      console.log("Fetched promotions:", data);
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
      setError(err.message || "Failed to load promotions.");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions(); // Fetch promotions on component mount
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target; // Removed type, checked as they are not used for these fields
    setNewPromotionData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitNewPromotion = async (e) => {
    e.preventDefault();

    // Basic validation - enhance as needed
    if (!newPromotionData.businessId || !newPromotionData.position /* Add other required fields here */) {
      alert("Business ID and Position (and other required fields) are required.");
      return;
    }
    setIsSubmitting(true);
    setError(null); 
    try {
      const payload = {
        ...newPromotionData,
        businessId: parseInt(newPromotionData.businessId, 10),
        // Ensure all fields expected by your '/promotions/add' API are included in payload
        // For example, if your API expects title, description, discountPercentage, startDate, endDate:
        // title: newPromotionData.title,
        // description: newPromotionData.description,
        // discountPercentage: parseFloat(newPromotionData.discountPercentage),
        // startDate: newPromotionData.startDate,
        // endDate: newPromotionData.endDate,
        // isApproved: true, // Or handle this based on your logic
      };
      const addedPromotion = await addPromotion(payload);
      console.log("Promotion added successfully:", addedPromotion);
      
      setShowAddModal(false);
      setNewPromotionData({ businessId: '', position: '' /* Reset other fields */ }); // Reset form
      fetchPromotions(); // Refetch promotions to show the new one
      alert("Promotion added successfully!"); // Or use a more subtle notification
    } catch (err) {
      console.error("Failed to add promotion:", err);
      setError(err.message || "Failed to add promotion."); // Set error state to display it
      alert(`Failed to add promotion: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) {
      return;
    }

    setDeletingItemId(promotionId);
    setError(null); // Clear previous errors

    try {
      console.log(`Attempting to delete promotion with ID: ${promotionId}`); // Added for debugging
      await deletePromotionById(promotionId);
      setPromotions(prevPromotions => prevPromotions.filter(promo => promo.id !== promotionId));
      console.log(`Promotion ${promotionId} deleted successfully from UI.`); // Added for debugging
      // No alert needed, visual removal is feedback.
    } catch (err) {
      console.error(`Failed to delete promotion ${promotionId}:`, err);
      setError(err.message || "Failed to delete promotion.");
      // No alert for error, error message will be displayed on the page.
    } finally {
      setDeletingItemId(null);
    }
  };

  if (loading && promotions.length === 0) return <div className={`promotions-page ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}><p className="loading-message">Loading promotions...</p></div>;
  // Keep error display for fetch errors, form errors will be handled separately if needed
  if (error && promotions.length === 0) return <div className={`promotions-page ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}><p className="error-message">Error fetching promotions: {error}</p></div>;


  return (
    <div className={`promotions-page ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="promotions-header">
        <h1>Promotions</h1>
        {/* <button className="add-promo-button" onClick={() => setShowAddModal(true)}>
          + Add Promotion
        </button> */}
      </div>

      {/* Display general page errors (e.g., from deletion) here, but not if modal is open and showing its own error */}
      {error && !showAddModal && <p className="error-message" style={{ textAlign: 'center', color: 'red', marginTop: '10px' }}>{error}</p>}

      

      <div className="promotions-grid">
        {/* Add Promotion Card */}
        <div className="add-promotion-card" onClick={() => setShowAddModal(true)}>
          <IoMdAddCircleOutline className="add-promo-icon" size={50} />
          <p>Add New Promotion</p>
        </div>

        {/* Existing Promotion Cards */}
        {promotions.map(promo => (
          <div key={promo.id} className="promotion-card">
            <button
              className="delete-promo-button"
              onClick={() => handleDeletePromotion(promo.id)}
              disabled={deletingItemId === promo.id || isSubmitting}
              aria-label="Delete promotion"
            >
              {deletingItemId === promo.id ? <span className="spinner-small"></span> : <FaTrash />}
            </button>
            {/* You'll need to adjust what's displayed based on your promotion object structure */}
            <h3>{promo.title || `Business ID: ${promo.businessId}`}</h3>
            <p>Position: {promo.position}</p>
            {promo.description && <p>Desc: {promo.description}</p>}
            {promo.discountPercentage && <p>Discount: {promo.discountPercentage}%</p>}
            {promo.startDate && <p>Starts: {new Date(promo.startDate).toLocaleDateString()}</p>}
            {promo.endDate && <p>Ends: {new Date(promo.endDate).toLocaleDateString()}</p>}
            <p className={`status ${promo.isApproved ? 'approved' : 'pending'}`}>
              Status: {promo.isApproved ? 'Approved' : 'Pending'}
            </p>
            {/* Add more details or actions (edit/delete) here if needed */}
          </div>
        ))}
          {promotions.length === 0 && !loading && !error && <p>No promotions found.</p>}
           </div>

      {/* Add Promotion Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Promotion</h2>
                {error && showAddModal && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>} {/* Display form submission error specifically for modal */}
            <form onSubmit={handleSubmitNewPromotion}>
              <div>
                <label htmlFor="businessId">Business ID*:</label>
                <input type="number" id="businessId" name="businessId" value={newPromotionData.businessId} onChange={handleInputChange} required />
              </div>
              <div>
                <label htmlFor="position">Position*:</label>
                <input type="text" id="position" name="position" value={newPromotionData.position} onChange={handleInputChange} required />
              </div>
              {/* 
                Add other fields required by your API for adding a promotion.
                For example:
              <div>
                <label htmlFor="title">Title*:</label>
                <input type="text" id="title" name="title" value={newPromotionData.title || ''} onChange={handleInputChange} required />
              </div>
              <div>
                <label htmlFor="description">Description:</label>
                <textarea id="description" name="description" value={newPromotionData.description || ''} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="discountPercentage">Discount %*:</label>
                <input type="number" id="discountPercentage" name="discountPercentage" value={newPromotionData.discountPercentage || ''} onChange={handleInputChange} required />
              </div>
              <div>
                <label htmlFor="startDate">Start Date*:</label>
                <input type="date" id="startDate" name="startDate" value={newPromotionData.startDate || ''} onChange={handleInputChange} required />
              </div>
              <div>
                <label htmlFor="endDate">End Date*:</label>
                <input type="date" id="endDate" name="endDate" value={newPromotionData.endDate || ''} onChange={handleInputChange} required />
              </div>
              */}
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ marginRight: '10px' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Promotions;

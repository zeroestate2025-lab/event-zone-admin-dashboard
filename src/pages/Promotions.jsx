import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import "../styles/Promotions.css";
import {
  getAllPromotions,
  addPromotion,
  deletePromotionById,
  getAllBusinessPartners,
  updatePromotionById,
} from "../services/apiService";
import { FaSpinner, FaEdit, FaTrash } from "react-icons/fa";

function Promotions({ isSidebarOpen }) {
  const [promotions, setPromotions] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPromoId, setDeletingPromoId] = useState(null);
  const [isPromoSubmitting, setIsPromoSubmitting] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPromotion, setEditingPromotion] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [promotionsData, businessesData] = await Promise.all([
        getAllPromotions(),
        getAllBusinessPartners(),
      ]);

      const approvedBusinesses = (businessesData || []).filter(
        (b) => b.isApproved
      );
      setPromotions(promotionsData || []);
      setBusinesses(approvedBusinesses);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const getBusinessById = (businessId) => {
    return businesses.find((b) => b.id === businessId);
  };

  const filteredBusinesses = businesses.filter(
    (business) =>
      business.proprietorName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.id?.toString().includes(searchTerm)
  );

  const handleDeletePromotion = async (promotionId) => {
    if (!window.confirm("Are you sure you want to remove this promotion?")) {
      return;
    }

    setDeletingPromoId(promotionId);
    try {
      await deletePromotionById(promotionId);
      setPromotions((prevPromotions) =>
        prevPromotions.filter((promo) => promo.id !== promotionId)
      );
    } catch (err) {
      console.error(`Failed to delete promotion ${promotionId}:`, err);
      setError(err.message || "Failed to delete promotion.");
    } finally {
      setDeletingPromoId(null);
    }
  };

  const handleOpenPromoModal = (promotion = null) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setSelectedBusinessId(promotion.businessId);
      setSelectedPosition(promotion.position);
      setSelectedImage(promotion.imageUrl || "");
    } else {
      setEditingPromotion(null);
      setSelectedBusinessId("");
      setSelectedPosition("");
      setSelectedImage("");
    }
    setShowPromoModal(true);
    setSearchTerm("");
  };

  const handleClosePromoModal = () => {
    setShowPromoModal(false);
    setEditingPromotion(null);
    setSelectedBusinessId("");
    setSelectedPosition("");
    setSelectedImage("");
    setSearchTerm("");
  };

  const handleSubmitPromotion = async (e) => {
    e.preventDefault();

    if (!selectedBusinessId || !selectedPosition) {
      setError("Please select a business and enter a position.");
      return;
    }

    if (!selectedImage) {
      setError("Please select an image from the business gallery.");
      return;
    }

    setIsPromoSubmitting(true);
    setError(null);

    try {
      const payload = {
        businessId: parseInt(selectedBusinessId),
        position: selectedPosition,
        imageUrl: selectedImage,
        isApproved: true,
      };

      if (editingPromotion) {
        await updatePromotionById(editingPromotion.id, payload);
      } else {
        await addPromotion(payload);
      }

      handleClosePromoModal();
      await fetchAllData();
    } catch (err) {
      console.error("Failed to save promotion:", err);
      setError(err.message || "Failed to save promotion.");
    } finally {
      setIsPromoSubmitting(false);
    }
  };

  if (loading && promotions.length === 0) {
    return (
      <div
        className={`promotions-container ${
          isSidebarOpen ? "sidebar-open" : "sidebar-closed"
        }`}
      >
        <PageHeader title="Promotions" showBreadcrumb={true} />
        <p className="loading-message">Loading data...</p>
      </div>
    );
  }

  return (
    <div
      className={`promotions-container ${
        isSidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      <PageHeader title="Promotions" showBreadcrumb={true} />

      {error && !showPromoModal && <p className="error-message">{error}</p>}

      <div className="section-wrapper">
        <h2 className="section-title">Promotions</h2>
        <div className="promotions-content-box">
          <div className="promotions-cards-grid">
            {promotions.map((promo) => {
              const business = getBusinessById(promo.businessId);
              const imageUrl =
                promo.imageUrl ||
                business?.images?.[0]?.url ||
                "https://via.placeholder.com/300x200?text=No+Image";
              const proprietorName =
                business?.proprietorName || "Unknown Business";

              return (
                <div key={promo.id} className="promotion-card">
                  <div className="promotion-image-container">
                    <img
                      src={imageUrl}
                      alt={proprietorName}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=No+Image";
                      }}
                    />
                    <div className="promotion-position-badge">
                      Position: {promo.position}
                    </div>
                  </div>
                  <div className="promotion-info-box">
                    <h3 className="promotion-business-name">
                      {proprietorName}
                    </h3>
                    <p className="promotion-business-id">ID: {promo.businessId}</p>
                  </div>
                  <div className="promotion-actions">
                    <button
                      className="edit-promotion-button"
                      onClick={() => handleOpenPromoModal(promo)}
                      title="Edit Promotion"
                    >
                      <FaEdit className="action-icon" />
                      <span className="action-text">Edit</span>
                    </button>
                    <button
                      className="remove-promotion-button"
                      onClick={() => handleDeletePromotion(promo.id)}
                      disabled={deletingPromoId === promo.id}
                      title="Remove Promotion"
                    >
                      {deletingPromoId === promo.id ? (
                        <>
                          <FaSpinner className="spinner-icon" />
                          <span className="action-text">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <FaTrash className="action-icon" />
                          <span className="action-text">Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            <div
              className="add-promotion-card"
              onClick={() => handleOpenPromoModal()}
            >
              <div className="add-promotion-content">
                <div className="add-image-placeholder">
                  <div className="add-icon-circle">
                    <span className="add-icon">+</span>
                  </div>
                  <p className="add-image-text">ADD PROMOTION</p>
                </div>
              </div>
            </div>
          </div>

          {promotions.length === 0 && !loading && (
            <p className="no-promotions-message">
              No promotions available. Add your first promotion!
            </p>
          )}
        </div>
      </div>

      {showPromoModal && (
        <div className="modal-overlay" onClick={handleClosePromoModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPromotion ? "Edit Promotion" : "Add New Promotion"}</h2>
              <button className="modal-close-button" onClick={handleClosePromoModal}>
                ×
              </button>
            </div>

            {error && showPromoModal && (
              <p className="modal-error-message">{error}</p>
            )}

            <form onSubmit={handleSubmitPromotion}>
              <div className="modal-form-group">
                <label htmlFor="business-select">Select Business*:</label>
                <select
                  id="business-select"
                  value={selectedBusinessId}
                  onChange={(e) => {
                    setSelectedBusinessId(e.target.value);
                    setSelectedImage("");
                  }}
                  className="modal-select"
                  required
                >
                  <option value="">-- Select a Business --</option>
                  {filteredBusinesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.proprietorName || business.businessName} (ID:{" "}
                      {business.id})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBusinessId && (
                <div className="modal-form-group">
                  <label>Select Promotion Image:</label>
                  <div className="business-images-grid">
                    {getBusinessById(parseInt(selectedBusinessId))?.images?.map(
                      (img) => (
                        <div
                          key={img.id}
                          className={`business-image-option ${
                            selectedImage === img.url ? "selected" : ""
                          }`}
                          onClick={() => setSelectedImage(img.url)}
                        >
                          <img src={img.url} alt={`Business ${img.id}`} />
                          {selectedImage === img.url && (
                            <div className="selected-checkmark">✓</div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  {!getBusinessById(parseInt(selectedBusinessId))?.images?.length && (
                    <p className="no-images-text">
                      No images found for this business.
                    </p>
                  )}
                </div>
              )}

              {selectedImage && (
                <div className="selected-preview">
                  <h4>Selected Image Preview:</h4>
                  <div className="preview-image-wrapper">
                    <img src={selectedImage} alt="Selected" />
                  </div>
                </div>
              )}

              <div className="modal-form-group">
                <label htmlFor="position-input">Position*:</label>
                <input
                  type="text"
                  id="position-input"
                  placeholder="Enter position (e.g., 1, 2, 3...)"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="modal-input"
                  required
                />
                <small className="input-hint">
                  Position determines order of display (1 = first)
                </small>
              </div>

              <div className="modal-form-actions">
                <button
                  type="button"
                  onClick={handleClosePromoModal}
                  className="modal-cancel-button"
                  disabled={isPromoSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-button"
                  disabled={isPromoSubmitting}
                >
                  {isPromoSubmitting ? (
                    <>
                      <FaSpinner className="spinner-icon" />{" "}
                      {editingPromotion ? "Updating..." : "Adding..."}
                    </>
                  ) : editingPromotion ? (
                    "Update Promotion"
                  ) : (
                    "Add Promotion"
                  )}
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

// import { useState, useEffect } from "react";
// import PageHeader from "../components/PageHeader";
// import "../styles/Promotions.css";
// import {
//   getAllPromotions,
//   addPromotion,
//   deletePromotionById,
//   getAllBusinessPartners,
//   updatePromotionById,
// } from "../services/apiService";
// import { FaSpinner, FaEdit, FaTrash } from "react-icons/fa";

// function Promotions({ isSidebarOpen }) {
//   const [promotions, setPromotions] = useState([]);
//   const [businesses, setBusinesses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [deletingPromoId, setDeletingPromoId] = useState(null);
//   const [isPromoSubmitting, setIsPromoSubmitting] = useState(false);
//   const [showPromoModal, setShowPromoModal] = useState(false);
//   const [selectedBusinessId, setSelectedBusinessId] = useState("");
//   const [selectedPosition, setSelectedPosition] = useState("");
//   const [selectedImage, setSelectedImage] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [editingPromotion, setEditingPromotion] = useState(null);

//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   const fetchAllData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [promotionsData, businessesData] = await Promise.all([
//         getAllPromotions(),
//         getAllBusinessPartners(),
//       ]);

//       const approvedBusinesses = (businessesData || []).filter(
//         (b) => b.isApproved
//       );
//       setPromotions(promotionsData || []);
//       setBusinesses(approvedBusinesses);
//     } catch (err) {
//       console.error("Failed to fetch data:", err);
//       setError(err.message || "Failed to load data.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getBusinessById = (businessId) => {
//     return businesses.find((b) => b.id === businessId);
//   };

//   const filteredBusinesses = businesses.filter(
//     (business) =>
//       business.proprietorName
//         ?.toLowerCase()
//         .includes(searchTerm.toLowerCase()) ||
//       business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       business.id?.toString().includes(searchTerm)
//   );

//   const handleDeletePromotion = async (promotionId) => {
//     if (!window.confirm("Are you sure you want to remove this promotion?")) {
//       return;
//     }

//     setDeletingPromoId(promotionId);
//     try {
//       await deletePromotionById(promotionId);
//       setPromotions((prevPromotions) =>
//         prevPromotions.filter((promo) => promo.id !== promotionId)
//       );
//     } catch (err) {
//       console.error(`Failed to delete promotion ${promotionId}:`, err);
//       setError(err.message || "Failed to delete promotion.");
//     } finally {
//       setDeletingPromoId(null);
//     }
//   };

//   const handleOpenPromoModal = (promotion = null) => {
//     if (promotion) {
//       setEditingPromotion(promotion);
//       setSelectedBusinessId(promotion.businessId);
//       setSelectedPosition(promotion.position);
//       setSelectedImage(promotion.imageUrl || "");
//     } else {
//       setEditingPromotion(null);
//       setSelectedBusinessId("");
//       setSelectedPosition("");
//       setSelectedImage("");
//     }
//     setShowPromoModal(true);
//     setSearchTerm("");
//   };

//   const handleClosePromoModal = () => {
//     setShowPromoModal(false);
//     setEditingPromotion(null);
//     setSelectedBusinessId("");
//     setSelectedPosition("");
//     setSelectedImage("");
//     setSearchTerm("");
//   };

//   const handleSubmitPromotion = async (e) => {
//     e.preventDefault();

//     if (!selectedBusinessId || !selectedPosition) {
//       setError("Please select a business and enter a position.");
//       return;
//     }

//     if (!selectedImage) {
//       setError("Please select an image from the business gallery.");
//       return;
//     }

//     setIsPromoSubmitting(true);
//     setError(null);

//     try {
//       const payload = {
//         businessId: parseInt(selectedBusinessId),
//         position: selectedPosition,
//         imageUrl: selectedImage,
//         isApproved: true,
//       };

//       if (editingPromotion) {
//         await updatePromotionById(editingPromotion.id, payload);
//       } else {
//         await addPromotion(payload);
//       }

//       handleClosePromoModal();
//       await fetchAllData();
//     } catch (err) {
//       console.error("Failed to save promotion:", err);
//       setError(err.message || "Failed to save promotion.");
//     } finally {
//       setIsPromoSubmitting(false);
//     }
//   };

//   if (loading && promotions.length === 0) {
//     return (
//       <div
//         className={`promotions-container ${
//           isSidebarOpen ? "sidebar-open" : "sidebar-closed"
//         }`}
//       >
//         <PageHeader title="Promotions" showBreadcrumb={true} />
//         <p className="loading-message">Loading data...</p>
//       </div>
//     );
//   }

//   return (
//     <div
//       className={`promotions-container ${
//         isSidebarOpen ? "sidebar-open" : "sidebar-closed"
//       }`}
//     >
//       <PageHeader title="Promotions" showBreadcrumb={true} />

//       {error && !showPromoModal && <p className="error-message">{error}</p>}

//       <div className="section-wrapper">
//         <h2 className="section-title">Promotions</h2>
//         <div className="promotions-content-box">
//           <div className="promotions-cards-grid">
//             {promotions.map((promo) => {
//               const business = getBusinessById(promo.businessId);
//               const imageUrl =
//                 promo.imageUrl ||
//                 business?.images?.[0]?.url ||
//                 "https://via.placeholder.com/300x200?text=No+Image";
//               const proprietorName =
//                 business?.proprietorName || "Unknown Business";

//               return (
//                 <div key={promo.id} className="promotion-card">
//                   <div className="promotion-image-container">
//                     <img
//                       src={imageUrl}
//                       alt={proprietorName}
//                       onError={(e) => {
//                         e.target.src =
//                           "https://via.placeholder.com/300x200?text=No+Image";
//                       }}
//                     />
//                     <div className="promotion-position-badge">
//                       Position: {promo.position}
//                     </div>
//                   </div>
//                   <div className="promotion-info-box">
//                     <h3 className="promotion-business-name">
//                       {proprietorName}
//                     </h3>
//                     <p className="promotion-business-id">ID: {promo.businessId}</p>
//                   </div>
//                   <div className="promotion-actions">
//                     <button
//                       className="edit-promotion-button"
//                       onClick={() => handleOpenPromoModal(promo)}
//                       title="Edit Promotion"
//                     >
//                       <FaEdit />
//                     </button>
//                     <button
//                       className="remove-promotion-button"
//                       // onClick={() => handleDeletePromotion(promo.id)}
//                       disabled={deletingPromoId === promo.id}
//                       title="Remove Promotion"
//                     >
//                       {deletingPromoId === promo.id ? (
//                         <FaSpinner className="spinner-small" />
//                       ) : (
//                         <FaTrash />
//                       )}
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}

//             <div
//               className="add-promotion-card"
//               onClick={() => handleOpenPromoModal()}
//             >
//               <div className="add-promotion-content">
//                 <div className="add-image-placeholder">
//                   <div className="add-icon-circle">
//                     <span className="add-icon">+</span>
//                   </div>
//                   <p className="add-image-text">ADD PROMOTION</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {promotions.length === 0 && !loading && (
//             <p className="no-promotions-message">
//               No promotions available. Add your first promotion!
//             </p>
//           )}
//         </div>
//       </div>

//       {showPromoModal && (
//         <div className="modal-overlay" onClick={handleClosePromoModal}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <h2>{editingPromotion ? "Edit Promotion" : "Add New Promotion"}</h2>
//               <button className="modal-close-button" onClick={handleClosePromoModal}>
//                 ×
//               </button>
//             </div>

//             {error && showPromoModal && (
//               <p className="modal-error-message">{error}</p>
//             )}

//             <form onSubmit={handleSubmitPromotion}>
//               {/* <div className="modal-form-group">
//                 <label htmlFor="business-search">Search Business by Name:</label>
//                 <input
//                   type="text"
//                   id="business-search"
//                   placeholder="Search by proprietor or business name..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="modal-search-input"
//                 />
//               </div> */}

//               <div className="modal-form-group">
//                 <label htmlFor="business-select">Select Business*:</label>
//                 <select
//                   id="business-select"
//                   value={selectedBusinessId}
//                   onChange={(e) => {
//                     setSelectedBusinessId(e.target.value);
//                     setSelectedImage("");
//                   }}
//                   className="modal-select"
//                   required
//                 >
//                   <option value="">-- Select a Business --</option>
//                   {filteredBusinesses.map((business) => (
//                     <option key={business.id} value={business.id}>
//                       {business.proprietorName || business.businessName} (ID:{" "}
//                       {business.id})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {selectedBusinessId && (
//                 <div className="modal-form-group">
//                   <label>Select Promotion Image:</label>
//                   <div className="business-images-grid">
//                     {getBusinessById(parseInt(selectedBusinessId))?.images?.map(
//                       (img) => (
//                         <div
//                           key={img.id}
//                           className={`business-image-option ${
//                             selectedImage === img.url ? "selected" : ""
//                           }`}
//                           onClick={() => setSelectedImage(img.url)}
//                         >
//                           <img src={img.url} alt={`Business ${img.id}`} />
//                         </div>
//                       )
//                     )}
//                   </div>
//                   {!getBusinessById(parseInt(selectedBusinessId))?.images?.length && (
//                     <p className="no-images-text">
//                       No images found for this business.
//                     </p>
//                   )}
//                 </div>
//               )}

//               {selectedImage && (
//                 <div className="selected-preview">
//                   <h4>Selected Image Preview:</h4>
//                   <img src={selectedImage} alt="Selected" />
//                 </div>
//               )}

//               <div className="modal-form-group">
//                 <label htmlFor="position-input">Position*:</label>
//                 <input
//                   type="text"
//                   id="position-input"
//                   placeholder="Enter position (e.g., 1, 2, 3...)"
//                   value={selectedPosition}
//                   onChange={(e) => setSelectedPosition(e.target.value)}
//                   className="modal-input"
//                   required
//                 />
//                 <small className="input-hint">
//                   Position determines order of display (1 = first)
//                 </small>
//               </div>

//               <div className="modal-form-actions">
//                 <button
//                   type="button"
//                   onClick={handleClosePromoModal}
//                   className="modal-cancel-button"
//                   disabled={isPromoSubmitting}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="modal-submit-button"
//                   disabled={isPromoSubmitting}
//                 >
//                   {isPromoSubmitting ? (
//                     <>
//                       <FaSpinner className="spinner-small" />{" "}
//                       {editingPromotion ? "Updating..." : "Adding..."}
//                     </>
//                   ) : editingPromotion ? (
//                     "Update Promotion"
//                   ) : (
//                     "Add Promotion"
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Promotions;

// // import { useState, useEffect } from 'react';
// // import PageHeader from '../components/PageHeader';
// // import '../styles/Promotions.css';
// // import { 
// //   getAllPromotions, 
// //   addPromotion, 
// //   deletePromotionById, 
// //   getAllBusinessPartners
// // } from '../services/apiService';
// // import { FaSpinner } from 'react-icons/fa';

// // function Promotions({ isSidebarOpen }) {
// //   const [promotions, setPromotions] = useState([]);
// //   const [businesses, setBusinesses] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [deletingPromoId, setDeletingPromoId] = useState(null);
// //   const [isPromoSubmitting, setIsPromoSubmitting] = useState(false);
// //   const [showPromoModal, setShowPromoModal] = useState(false);
// //   const [selectedBusinessId, setSelectedBusinessId] = useState('');
// //   const [selectedPosition, setSelectedPosition] = useState('');
// //   const [searchTerm, setSearchTerm] = useState('');

// //   useEffect(() => {
// //     fetchAllData();
// //   }, []);

// //   const fetchAllData = async () => {
// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const [promotionsData, businessesData] = await Promise.all([
// //         getAllPromotions(),
// //         getAllBusinessPartners(),
// //       ]);

// //       const approvedBusinesses = (businessesData || []).filter(b => b.isApproved);
// //       setPromotions(promotionsData || []);
// //       setBusinesses(approvedBusinesses);
// //     } catch (err) {
// //       console.error('Failed to fetch data:', err);
// //       setError(err.message || 'Failed to load data.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const getBusinessById = (businessId) => {
// //     return businesses.find(b => b.id === businessId);
// //   };

// //   const filteredBusinesses = businesses.filter(business =>
// //     business.proprietorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //     business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //     business.id?.toString().includes(searchTerm)
// //   );

// //   const handleDeletePromotion = async (promotionId) => {
// //     if (!window.confirm('Are you sure you want to remove this promotion?')) {
// //       return;
// //     }

// //     setDeletingPromoId(promotionId);
// //     try {
// //       await deletePromotionById(promotionId);
// //       setPromotions(prevPromotions => 
// //         prevPromotions.filter(promo => promo.id !== promotionId)
// //       );
// //     } catch (err) {
// //       console.error(`Failed to delete promotion ${promotionId}:`, err);
// //       setError(err.message || 'Failed to delete promotion.');
// //     } finally {
// //       setDeletingPromoId(null);
// //     }
// //   };

// //   const handleOpenPromoModal = () => {
// //     setShowPromoModal(true);
// //     setSelectedBusinessId('');
// //     setSelectedPosition('');
// //     setSearchTerm('');
// //   };

// //   const handleClosePromoModal = () => {
// //     setShowPromoModal(false);
// //     setSelectedBusinessId('');
// //     setSelectedPosition('');
// //     setSearchTerm('');
// //   };

// //   const handleSubmitPromotion = async (e) => {
// //     e.preventDefault();
    
// //     if (!selectedBusinessId || !selectedPosition) {
// //       setError('Please select a business and enter a position.');
// //       return;
// //     }

// //     setIsPromoSubmitting(true);
// //     setError(null);
    
// //     try {
// //       const payload = {
// //         businessId: parseInt(selectedBusinessId),
// //         position: selectedPosition,
// //         isApproved: true
// //       };

// //       await addPromotion(payload);
// //       handleClosePromoModal();
// //       await fetchAllData();
// //     } catch (err) {
// //       console.error('Failed to add promotion:', err);
// //       setError(err.message || 'Failed to add promotion.');
// //     } finally {
// //       setIsPromoSubmitting(false);
// //     }
// //   };

// //   if (loading && promotions.length === 0) {
// //     return (
// //       <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// //         <PageHeader title="Promotions" showBreadcrumb={true} />
// //         <p className="loading-message">Loading data...</p>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// //       <PageHeader title="Promotions" showBreadcrumb={true} />

// //       {error && !showPromoModal && <p className="error-message">{error}</p>}

// //       <div className="section-wrapper">
// //         <h2 className="section-title">Promotions</h2>
// //         <div className="promotions-content-box">
// //           <div className="promotions-cards-grid">
// //             {promotions.map(promo => {
// //               const business = getBusinessById(promo.businessId);
// //               const imageUrl = business?.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image';
// //               const proprietorName = business?.proprietorName || 'Unknown Business';

// //               return (
// //                 <div key={promo.id} className="promotion-card">
// //                   <div className="promotion-image-container">
// //                     <img 
// //                       src={imageUrl} 
// //                       alt={proprietorName}
// //                       onError={(e) => {
// //                         e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
// //                       }}
// //                     />
// //                     <div className="promotion-position-badge">
// //                       Position: {promo.position}
// //                     </div>
// //                   </div>
// //                   <div className="promotion-info-box">
// //                     <h3 className="promotion-business-name">{proprietorName}</h3>
// //                     <p className="promotion-business-id">ID: {promo.businessId}</p>
// //                   </div>
// //                   <button
// //                     className="remove-promotion-button"
// //                     onClick={() => handleDeletePromotion(promo.id)}
// //                     disabled={deletingPromoId === promo.id}
// //                     title="Remove Promotion"
// //                   >
// //                     {deletingPromoId === promo.id ? (
// //                       <FaSpinner className="spinner-small" />
// //                     ) : (
// //                       'REMOVE'
// //                     )}
// //                   </button>
// //                 </div>
// //               );
// //             })}

// //             <div className="add-promotion-card" onClick={handleOpenPromoModal}>
// //               <div className="add-promotion-content">
// //                 <div className="add-image-placeholder">
// //                   <div className="add-icon-circle">
// //                     <span className="add-icon">+</span>
// //                   </div>
// //                   <p className="add-image-text">ADD PROMOTION</p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {promotions.length === 0 && !loading && (
// //             <p className="no-promotions-message">No promotions available. Add your first promotion!</p>
// //           )}
// //         </div>
// //       </div>

// //       {showPromoModal && (
// //         <div className="modal-overlay" onClick={handleClosePromoModal}>
// //           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
// //             <div className="modal-header">
// //               <h2>Add New Promotion</h2>
// //               <button className="modal-close-button" onClick={handleClosePromoModal}>×</button>
// //             </div>

// //             {error && showPromoModal && <p className="modal-error-message">{error}</p>}

// //             <form onSubmit={handleSubmitPromotion}>
// //               <div className="modal-form-group">
// //                 <label htmlFor="business-search">Search Business by Name:</label>
// //                 <input
// //                   type="text"
// //                   id="business-search"
// //                   placeholder="Search by proprietor name or business name..."
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                   className="modal-search-input"
// //                 />
// //               </div>

// //               <div className="modal-form-group">
// //                 <label htmlFor="business-select">Select Business*:</label>
// //                 <select
// //                   id="business-select"
// //                   value={selectedBusinessId}
// //                   onChange={(e) => setSelectedBusinessId(e.target.value)}
// //                   className="modal-select"
// //                   required
// //                 >
// //                   <option value="">-- Select a Business --</option>
// //                   {filteredBusinesses.map(business => (
// //                     <option key={business.id} value={business.id}>
// //                       {business.proprietorName || business.businessName} (ID: {business.id})
// //                     </option>
// //                   ))}
// //                 </select>
// //                 {filteredBusinesses.length === 0 && searchTerm && (
// //                   <p className="no-results-text">No businesses found matching your search.</p>
// //                 )}
// //               </div>

// //               <div className="modal-form-group">
// //                 <label htmlFor="position-input">Position*:</label>
// //                 <input
// //                   type="text"
// //                   id="position-input"
// //                   placeholder="Enter position (e.g., 1, 2, 3...)"
// //                   value={selectedPosition}
// //                   onChange={(e) => setSelectedPosition(e.target.value)}
// //                   className="modal-input"
// //                   required
// //                 />
// //                 <small className="input-hint">Position determines the order of display (1 = first)</small>
// //               </div>

// //               <div className="modal-form-actions">
// //                 <button 
// //                   type="button" 
// //                   onClick={handleClosePromoModal} 
// //                   className="modal-cancel-button"
// //                   disabled={isPromoSubmitting}
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button 
// //                   type="submit" 
// //                   className="modal-submit-button"
// //                   disabled={isPromoSubmitting || !selectedBusinessId || !selectedPosition}
// //                 >
// //                   {isPromoSubmitting ? (
// //                     <>
// //                       <FaSpinner className="spinner-small" /> Adding...
// //                     </>
// //                   ) : (
// //                     'Add Promotion'
// //                   )}
// //                 </button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default Promotions;

// // // import { useState, useEffect } from 'react';
// // // import PageHeader from '../components/PageHeader';
// // // import '../styles/Promotions.css';
// // // import { 
// // //   getAllPromotions, 
// // //   addPromotion, 
// // //   deletePromotionById, 
// // //   getAllBusinessPartners,
// // //   getAllOffers,
// // //   createOffer,
// // //   updateOffer,
// // //   deleteOffer
// // // } from '../services/apiService';
// // // import { FaTrash, FaSpinner, FaEdit } from 'react-icons/fa';

// // // function Promotions({ isSidebarOpen }) {
// // //   // Promotions state
// // //   const [promotions, setPromotions] = useState([]);
// // //   const [businesses, setBusinesses] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState(null);
// // //   const [deletingPromoId, setDeletingPromoId] = useState(null);
// // //   const [isPromoSubmitting, setIsPromoSubmitting] = useState(false);
// // //   const [showPromoModal, setShowPromoModal] = useState(false);
// // //   const [selectedBusinessId, setSelectedBusinessId] = useState('');
// // //   const [selectedPosition, setSelectedPosition] = useState('');
// // //   const [searchTerm, setSearchTerm] = useState('');

// // //   // Offers state
// // //   const [offers, setOffers] = useState([]);
// // //   const [deletingOfferId, setDeletingOfferId] = useState(null);
// // //   const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
// // //   const [showOfferModal, setShowOfferModal] = useState(false);
// // //   const [editingOffer, setEditingOffer] = useState(null);
// // //   const [offerFormData, setOfferFormData] = useState({
// // //     redirectionUrl: '',
// // //     position: '',
// // //     image: null,
// // //     video: null,
// // //   });
// // //   const [previewImage, setPreviewImage] = useState(null);
// // //   const [previewVideo, setPreviewVideo] = useState(null);

// // //   useEffect(() => {
// // //     fetchAllData();
// // //   }, []);

// // //   const fetchAllData = async () => {
// // //     setLoading(true);
// // //     setError(null);
// // //     try {
// // //       const [promotionsData, businessesData, offersData] = await Promise.all([
// // //         getAllPromotions(),
// // //         getAllBusinessPartners(),
// // //         getAllOffers()
// // //       ]);
      
// // //       const approvedBusinesses = (businessesData || []).filter(b => b.isApproved);
      
// // //       setPromotions(promotionsData || []);
// // //       setBusinesses(approvedBusinesses);
// // //       setOffers(offersData || []);
// // //       console.log('Promotions:', promotionsData);
// // //       console.log('Offers:', offersData);
// // //     } catch (err) {
// // //       console.error('Failed to fetch data:', err);
// // //       setError(err.message || 'Failed to load data.');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   // ==================== PROMOTIONS FUNCTIONS ====================
// // //   const getBusinessById = (businessId) => {
// // //     return businesses.find(b => b.id === businessId);
// // //   };

// // //   const filteredBusinesses = businesses.filter(business =>
// // //     business.proprietorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //     business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //     business.id?.toString().includes(searchTerm)
// // //   );

// // //   const handleDeletePromotion = async (promotionId) => {
// // //     if (!window.confirm('Are you sure you want to remove this promotion?')) {
// // //       return;
// // //     }

// // //     setDeletingPromoId(promotionId);
// // //     try {
// // //       await deletePromotionById(promotionId);
// // //       setPromotions(prevPromotions => 
// // //         prevPromotions.filter(promo => promo.id !== promotionId)
// // //       );
// // //     } catch (err) {
// // //       console.error(`Failed to delete promotion ${promotionId}:`, err);
// // //       setError(err.message || 'Failed to delete promotion.');
// // //     } finally {
// // //       setDeletingPromoId(null);
// // //     }
// // //   };

// // //   const handleOpenPromoModal = () => {
// // //     setShowPromoModal(true);
// // //     setSelectedBusinessId('');
// // //     setSelectedPosition('');
// // //     setSearchTerm('');
// // //   };

// // //   const handleClosePromoModal = () => {
// // //     setShowPromoModal(false);
// // //     setSelectedBusinessId('');
// // //     setSelectedPosition('');
// // //     setSearchTerm('');
// // //   };

// // //   const handleSubmitPromotion = async (e) => {
// // //     e.preventDefault();
    
// // //     if (!selectedBusinessId || !selectedPosition) {
// // //       setError('Please select a business and enter a position.');
// // //       return;
// // //     }

// // //     setIsPromoSubmitting(true);
// // //     setError(null);
    
// // //     try {
// // //       const payload = {
// // //         businessId: parseInt(selectedBusinessId),
// // //         position: selectedPosition,
// // //         isApproved: true
// // //       };

// // //       await addPromotion(payload);
// // //       handleClosePromoModal();
// // //       await fetchAllData();
// // //     } catch (err) {
// // //       console.error('Failed to add promotion:', err);
// // //       setError(err.message || 'Failed to add promotion.');
// // //     } finally {
// // //       setIsPromoSubmitting(false);
// // //     }
// // //   };

// // //   // ==================== OFFERS FUNCTIONS ====================
// // //   const handleOpenOfferModal = (offer = null) => {
// // //     if (offer) {
// // //       setEditingOffer(offer);
// // //       setOfferFormData({
// // //         redirectionUrl: offer.redirectionUrl || '',
// // //         position: offer.position || '',
// // //         image: null,
// // //         video: null,
// // //       });
// // //       setPreviewImage(offer.imageUrl || null);
// // //       setPreviewVideo(offer.videoUrl || null);
// // //     } else {
// // //       setEditingOffer(null);
// // //       setOfferFormData({
// // //         redirectionUrl: '',
// // //         position: '',
// // //         image: null,
// // //         video: null,
// // //       });
// // //       setPreviewImage(null);
// // //       setPreviewVideo(null);
// // //     }
// // //     setShowOfferModal(true);
// // //   };

// // //   const handleCloseOfferModal = () => {
// // //     setShowOfferModal(false);
// // //     setEditingOffer(null);
// // //     setOfferFormData({
// // //       redirectionUrl: '',
// // //       position: '',
// // //       image: null,
// // //       video: null,
// // //     });
// // //     setPreviewImage(null);
// // //     setPreviewVideo(null);
// // //   };

// // //   const handleOfferInputChange = (e) => {
// // //     const { name, value } = e.target;
// // //     setOfferFormData(prev => ({
// // //       ...prev,
// // //       [name]: value,
// // //     }));
// // //   };

// // //   const handleImageChange = (e) => {
// // //     const file = e.target.files[0];
// // //     if (file) {
// // //       setOfferFormData(prev => ({
// // //         ...prev,
// // //         image: file,
// // //       }));
// // //       setPreviewImage(URL.createObjectURL(file));
// // //     }
// // //   };

// // //   const handleVideoChange = (e) => {
// // //     const file = e.target.files[0];
// // //     if (file) {
// // //       setOfferFormData(prev => ({
// // //         ...prev,
// // //         video: file,
// // //       }));
// // //       setPreviewVideo(URL.createObjectURL(file));
// // //     }
// // //   };

// // //   const handleSubmitOffer = async (e) => {
// // //     e.preventDefault();
    
// // //     if (!offerFormData.redirectionUrl || !offerFormData.position) {
// // //       setError('Please fill in all required fields.');
// // //       return;
// // //     }

// // //     if (!editingOffer && !offerFormData.image && !offerFormData.video) {
// // //       setError('Please upload at least an image or video.');
// // //       return;
// // //     }

// // //     setIsOfferSubmitting(true);
// // //     setError(null);

// // //     try {
// // //       const submitFormData = new FormData();
// // //       submitFormData.append('redirectionUrl', offerFormData.redirectionUrl);
// // //       submitFormData.append('position', offerFormData.position);
      
// // //       if (offerFormData.image) {
// // //         submitFormData.append('image', offerFormData.image);
// // //       }
// // //       if (offerFormData.video) {
// // //         submitFormData.append('video', offerFormData.video);
// // //       }

// // //       if (editingOffer) {
// // //         await updateOffer(editingOffer.id, submitFormData);
// // //       } else {
// // //         await createOffer(submitFormData);
// // //       }

// // //       handleCloseOfferModal();
// // //       await fetchAllData();
// // //     } catch (err) {
// // //       console.error('Failed to submit offer:', err);
// // //       setError(err.message || 'Failed to submit offer.');
// // //     } finally {
// // //       setIsOfferSubmitting(false);
// // //     }
// // //   };

// // //   const handleDeleteOffer = async (offerId) => {
// // //     if (!window.confirm('Are you sure you want to delete this offer?')) {
// // //       return;
// // //     }

// // //     setDeletingOfferId(offerId);
// // //     setError(null);

// // //     try {
// // //       await deleteOffer(offerId);
// // //       setOffers(prevOffers => 
// // //         prevOffers.filter(offer => offer.id !== offerId)
// // //       );
// // //     } catch (err) {
// // //       console.error(`Failed to delete offer ${offerId}:`, err);
// // //       setError(err.message || 'Failed to delete offer.');
// // //     } finally {
// // //       setDeletingOfferId(null);
// // //     }
// // //   };

// // //   if (loading && promotions.length === 0 && offers.length === 0) {
// // //     return (
// // //       <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// // //         <PageHeader title="Promotions & Offers" showBreadcrumb={true} />
// // //         <p className="loading-message">Loading data...</p>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// // //       <PageHeader title="Promotions & Offers" showBreadcrumb={true} />

// // //       {error && !showPromoModal && !showOfferModal && <p className="error-message">{error}</p>}

// // //       {/* ==================== PROMOTIONS SECTION ==================== */}
// // //       <div className="section-wrapper">
// // //         <h2 className="section-title">Promotions</h2>
// // //         <div className="promotions-content-box">
// // //           <div className="promotions-cards-grid">
// // //             {/* Existing Promotion Cards */}
// // //             {promotions.map(promo => {
// // //               const business = getBusinessById(promo.businessId);
// // //               const imageUrl = business?.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image';
// // //               const proprietorName = business?.proprietorName || 'Unknown Business';

// // //               return (
// // //                 <div key={promo.id} className="promotion-card">
// // //                   <div className="promotion-image-container">
// // //                     <img 
// // //                       src={imageUrl} 
// // //                       alt={proprietorName}
// // //                       onError={(e) => {
// // //                         e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
// // //                       }}
// // //                     />
// // //                     <div className="promotion-position-badge">
// // //                       Position: {promo.position}
// // //                     </div>
// // //                   </div>
// // //                   <div className="promotion-info-box">
// // //                     <h3 className="promotion-business-name">{proprietorName}</h3>
// // //                     <p className="promotion-business-id">ID: {promo.businessId}</p>
// // //                   </div>
// // //                   <button
// // //                     className="remove-promotion-button"
// // //                     onClick={() => handleDeletePromotion(promo.id)}
// // //                     disabled={deletingPromoId === promo.id}
// // //                     title="Remove Promotion"
// // //                   >
// // //                     {deletingPromoId === promo.id ? (
// // //                       <FaSpinner className="spinner-small" />
// // //                     ) : (
// // //                       'REMOVE'
// // //                     )}
// // //                   </button>
// // //                 </div>
// // //               );
// // //             })}

// // //             {/* Add New Promotion Card */}
// // //             <div className="add-promotion-card" onClick={handleOpenPromoModal}>
// // //               <div className="add-promotion-content">
// // //                 <div className="add-image-placeholder">
// // //                   <div className="add-icon-circle">
// // //                     <span className="add-icon">+</span>
// // //                   </div>
// // //                   <p className="add-image-text">ADD PROMOTION</p>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {promotions.length === 0 && !loading && (
// // //             <p className="no-promotions-message">No promotions available. Add your first promotion!</p>
// // //           )}
// // //         </div>
// // //       </div>

// // //       {/* ==================== OFFERS SECTION ==================== */}
// // //       <div className="section-wrapper">
// // //         <h2 className="section-title">Offers</h2>
// // //         <div className="offers-content-box">
// // //           <div className="offers-cards-grid">
// // //             {/* Existing Offer Cards */}
// // //             {offers.map(offer => (
// // //               <div key={offer.id} className="offer-card">
// // //                 <div className="offer-media-container">
// // //                   {offer.imageUrl ? (
// // //                     <img 
// // //                       src={offer.imageUrl} 
// // //                       alt={`Offer ${offer.id}`}
// // //                       onError={(e) => {
// // //                         e.target.style.display = 'none';
// // //                       }}
// // //                     />
// // //                   ) : offer.videoUrl ? (
// // //                     <video 
// // //                       src={offer.videoUrl}
// // //                       controls
// // //                       style={{ width: '100%', height: '100%', objectFit: 'cover' }}
// // //                     />
// // //                   ) : (
// // //                     <div className="no-media-placeholder">
// // //                       <span>No Media</span>
// // //                     </div>
// // //                   )}
// // //                   <div className="offer-position-badge">
// // //                     Position: {offer.position}
// // //                   </div>
// // //                 </div>
// // //                 <div className="offer-info-box">
// // //                   <p className="offer-url">
// // //                     <strong>URL:</strong> <a href={offer.redirectionUrl} target="_blank" rel="noopener noreferrer">Link</a>
// // //                   </p>
// // //                 </div>
// // //                 <div className="offer-actions">
// // //                   <button
// // //                     onClick={() => handleOpenOfferModal(offer)}
// // //                     className="edit-offer-button"
// // //                     disabled={isOfferSubmitting}
// // //                     title="Edit Offer"
// // //                   >
// // //                     <FaEdit />
// // //                   </button>
// // //                   <button
// // //                     onClick={() => handleDeleteOffer(offer.id)}
// // //                     className="delete-offer-button"
// // //                     disabled={deletingOfferId === offer.id}
// // //                     title="Delete Offer"
// // //                   >
// // //                     {deletingOfferId === offer.id ? (
// // //                       <FaSpinner className="spinner-icon" />
// // //                     ) : (
// // //                       <FaTrash />
// // //                     )}
// // //                   </button>
// // //                 </div>
// // //               </div>
// // //             ))}

// // //             {/* Add New Offer Card */}
// // //             <div className="add-offer-card" onClick={() => handleOpenOfferModal()}>
// // //               <div className="add-offer-content">
// // //                 <div className="add-offer-placeholder">
// // //                   <div className="add-icon-circle">
// // //                     <span className="add-icon">+</span>
// // //                   </div>
// // //                   <p className="add-offer-text">ADD OFFER</p>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {offers.length === 0 && !loading && (
// // //             <p className="no-offers-message">No offers available. Add your first offer!</p>
// // //           )}
// // //         </div>
// // //       </div>

// // //       {/* ==================== PROMOTION MODAL ==================== */}
// // //       {showPromoModal && (
// // //         <div className="modal-overlay" onClick={handleClosePromoModal}>
// // //           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
// // //             <div className="modal-header">
// // //               <h2>Add New Promotion</h2>
// // //               <button className="modal-close-button" onClick={handleClosePromoModal}>×</button>
// // //             </div>

// // //             {error && showPromoModal && <p className="modal-error-message">{error}</p>}

// // //             <form onSubmit={handleSubmitPromotion}>
// // //               <div className="modal-form-group">
// // //                 <label htmlFor="business-search">Search Business by Name:</label>
// // //                 <input
// // //                   type="text"
// // //                   id="business-search"
// // //                   placeholder="Search by proprietor name or business name..."
// // //                   value={searchTerm}
// // //                   onChange={(e) => setSearchTerm(e.target.value)}
// // //                   className="modal-search-input"
// // //                 />
// // //               </div>

// // //               <div className="modal-form-group">
// // //                 <label htmlFor="business-select">Select Business*:</label>
// // //                 <select
// // //                   id="business-select"
// // //                   value={selectedBusinessId}
// // //                   onChange={(e) => setSelectedBusinessId(e.target.value)}
// // //                   className="modal-select"
// // //                   required
// // //                 >
// // //                   <option value="">-- Select a Business --</option>
// // //                   {filteredBusinesses.map(business => (
// // //                     <option key={business.id} value={business.id}>
// // //                       {business.proprietorName || business.businessName} (ID: {business.id})
// // //                     </option>
// // //                   ))}
// // //                 </select>
// // //                 {filteredBusinesses.length === 0 && searchTerm && (
// // //                   <p className="no-results-text">No businesses found matching your search.</p>
// // //                 )}
// // //               </div>

// // //               <div className="modal-form-group">
// // //                 <label htmlFor="position-input">Position*:</label>
// // //                 <input
// // //                   type="text"
// // //                   id="position-input"
// // //                   placeholder="Enter position (e.g., 1, 2, 3...)"
// // //                   value={selectedPosition}
// // //                   onChange={(e) => setSelectedPosition(e.target.value)}
// // //                   className="modal-input"
// // //                   required
// // //                 />
// // //                 <small className="input-hint">Position determines the order of display (1 = first)</small>
// // //               </div>

// // //               <div className="modal-form-actions">
// // //                 <button 
// // //                   type="button" 
// // //                   onClick={handleClosePromoModal} 
// // //                   className="modal-cancel-button"
// // //                   disabled={isPromoSubmitting}
// // //                 >
// // //                   Cancel
// // //                 </button>
// // //                 <button 
// // //                   type="submit" 
// // //                   className="modal-submit-button"
// // //                   disabled={isPromoSubmitting || !selectedBusinessId || !selectedPosition}
// // //                 >
// // //                   {isPromoSubmitting ? (
// // //                     <>
// // //                       <FaSpinner className="spinner-small" /> Adding...
// // //                     </>
// // //                   ) : (
// // //                     'Add Promotion'
// // //                   )}
// // //                 </button>
// // //               </div>
// // //             </form>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* ==================== OFFER MODAL ==================== */}
// // //       {showOfferModal && (
// // //         <div className="modal-overlay" onClick={handleCloseOfferModal}>
// // //           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
// // //             <div className="modal-header">
// // //               <h2>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</h2>
// // //               <button className="modal-close-button" onClick={handleCloseOfferModal}>×</button>
// // //             </div>

// // //             {error && showOfferModal && <p className="modal-error-message">{error}</p>}

// // //             <form onSubmit={handleSubmitOffer}>
// // //               <div className="modal-form-group">
// // //                 <label htmlFor="redirectionUrl">Redirection URL*:</label>
// // //                 <input
// // //                   type="url"
// // //                   id="redirectionUrl"
// // //                   name="redirectionUrl"
// // //                   placeholder="https://example.com"
// // //                   value={offerFormData.redirectionUrl}
// // //                   onChange={handleOfferInputChange}
// // //                   className="modal-input"
// // //                   required
// // //                 />
// // //               </div>

// // //               <div className="modal-form-group">
// // //                 <label htmlFor="offerPosition">Position*:</label>
// // //                 <input
// // //                   type="number"
// // //                   id="offerPosition"
// // //                   name="position"
// // //                   placeholder="Enter position (1, 2, 3...)"
// // //                   value={offerFormData.position}
// // //                   onChange={handleOfferInputChange}
// // //                   className="modal-input"
// // //                   required
// // //                 />
// // //                 <small className="input-hint">Position determines the order of display (1 = first)</small>
// // //               </div>

// // //               <div className="modal-form-group">
// // //                 <label htmlFor="image">Image (Optional):</label>
// // //                 <input
// // //                   type="file"
// // //                   id="image"
// // //                   accept="image/*"
// // //                   onChange={handleImageChange}
// // //                   className="modal-file-input"
// // //                 />
// // //                 {previewImage && (
// // //                   <div className="media-preview">
// // //                     <img src={previewImage} alt="Preview" />
// // //                   </div>
// // //                 )}
// // //               </div>

// // //               <div className="modal-form-group">
// // //                 <label htmlFor="video">Video (Optional):</label>
// // //                 <input
// // //                   type="file"
// // //                   id="video"
// // //                   accept="video/*"
// // //                   onChange={handleVideoChange}
// // //                   className="modal-file-input"
// // //                 />
// // //                 {previewVideo && (
// // //                   <div className="media-preview">
// // //                     <video controls>
// // //                       <source src={previewVideo} />
// // //                     </video>
// // //                   </div>
// // //                 )}
// // //               </div>

// // //               <div className="modal-form-actions">
// // //                 <button 
// // //                   type="button" 
// // //                   onClick={handleCloseOfferModal} 
// // //                   className="modal-cancel-button"
// // //                   disabled={isOfferSubmitting}
// // //                 >
// // //                   Cancel
// // //                 </button>
// // //                 <button 
// // //                   type="submit" 
// // //                   className="modal-submit-button"
// // //                   disabled={isOfferSubmitting || !offerFormData.redirectionUrl || !offerFormData.position}
// // //                 >
// // //                   {isOfferSubmitting ? (
// // //                     <>
// // //                       <FaSpinner className="spinner-icon" /> {editingOffer ? 'Updating...' : 'Adding...'}
// // //                     </>
// // //                   ) : (
// // //                     editingOffer ? 'Update Offer' : 'Add Offer'
// // //                   )}
// // //                 </button>
// // //               </div>
// // //             </form>
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }

// // // export default Promotions;

// // // // import { useState, useEffect } from 'react';
// // // // import { 
// // // //   getAllPromotions, 
// // // //   addPromotion, 
// // // //   deletePromotionById, 
// // // //   getAllBusinessPartners 
// // // // } from '../services/apiService';
// // // // import { FaTrash } from 'react-icons/fa';
// // // // import '../styles/Promotions.css';

// // // // function Promotions({ isSidebarOpen }) {
// // // //   const [promotions, setPromotions] = useState([]);
// // // //   const [businesses, setBusinesses] = useState([]);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [error, setError] = useState(null);
// // // //   const [deletingItemId, setDeletingItemId] = useState(null);
// // // //   const [isSubmitting, setIsSubmitting] = useState(false);
  
// // // //   // Modal states
// // // //   const [showAddModal, setShowAddModal] = useState(false);
// // // //   const [selectedBusinessId, setSelectedBusinessId] = useState('');
// // // //   const [selectedPosition, setSelectedPosition] = useState('');
// // // //   const [searchTerm, setSearchTerm] = useState('');

// // // //   useEffect(() => {
// // // //     fetchData();
// // // //   }, []);

// // // //   const fetchData = async () => {
// // // //     setLoading(true);
// // // //     setError(null);
// // // //     try {
// // // //       const [promotionsData, businessesData] = await Promise.all([
// // // //         getAllPromotions(),
// // // //         getAllBusinessPartners()
// // // //       ]);
      
// // // //       // Only get approved businesses
// // // //       const approvedBusinesses = (businessesData || []).filter(b => b.isApproved);
      
// // // //       setPromotions(promotionsData || []);
// // // //       setBusinesses(approvedBusinesses);
// // // //       console.log('Promotions:', promotionsData);
// // // //       console.log('Approved Businesses:', approvedBusinesses);
// // // //     } catch (err) {
// // // //       console.error('Failed to fetch data:', err);
// // // //       setError(err.message || 'Failed to load data.');
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   const getBusinessById = (businessId) => {
// // // //     return businesses.find(b => b.id === businessId);
// // // //   };

// // // //   // Filter businesses based on search term
// // // //   const filteredBusinesses = businesses.filter(business =>
// // // //     business.proprietorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // // //     business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // // //     business.id?.toString().includes(searchTerm)
// // // //   );

// // // //   const handleDeletePromotion = async (promotionId) => {
// // // //     if (!window.confirm('Are you sure you want to remove this promotion?')) {
// // // //       return;
// // // //     }

// // // //     setDeletingItemId(promotionId);
// // // //     try {
// // // //       await deletePromotionById(promotionId);
// // // //       setPromotions(prevPromotions => 
// // // //         prevPromotions.filter(promo => promo.id !== promotionId)
// // // //       );
// // // //     } catch (err) {
// // // //       console.error(`Failed to delete promotion ${promotionId}:`, err);
// // // //       setError(err.message || 'Failed to delete promotion.');
// // // //     } finally {
// // // //       setDeletingItemId(null);
// // // //     }
// // // //   };

// // // //   const handleOpenModal = () => {
// // // //     setShowAddModal(true);
// // // //     setSelectedBusinessId('');
// // // //     setSelectedPosition('');
// // // //     setSearchTerm('');
// // // //     setError(null);
// // // //   };

// // // //   const handleCloseModal = () => {
// // // //     setShowAddModal(false);
// // // //     setSelectedBusinessId('');
// // // //     setSelectedPosition('');
// // // //     setSearchTerm('');
// // // //     setError(null);
// // // //   };

// // // //   const handleSubmitPromotion = async (e) => {
// // // //     e.preventDefault();
    
// // // //     if (!selectedBusinessId || !selectedPosition) {
// // // //       setError('Please select a business and enter a position.');
// // // //       return;
// // // //     }

// // // //     setIsSubmitting(true);
// // // //     setError(null);
    
// // // //     try {
// // // //       const payload = {
// // // //         businessId: parseInt(selectedBusinessId),
// // // //         position: selectedPosition,
// // // //         isApproved: true
// // // //       };

// // // //       const addedPromotion = await addPromotion(payload);
// // // //       console.log('Promotion added successfully:', addedPromotion);
      
// // // //       handleCloseModal();
// // // //       await fetchData();
// // // //     } catch (err) {
// // // //       console.error('Failed to add promotion:', err);
// // // //       setError(err.message || 'Failed to add promotion.');
// // // //     } finally {
// // // //       setIsSubmitting(false);
// // // //     }
// // // //   };

// // // //   if (loading && promotions.length === 0) {
// // // //     return (
// // // //       <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// // // //         <div className="promotions-header-box">
// // // //           <h1 className="promotions-title">Promotions</h1>
// // // //         </div>
// // // //         <p className="loading-message">Loading promotions...</p>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// // // //       <div className="promotions-header-box">
// // // //         <h1 className="promotions-title">Promotions</h1>
// // // //       </div>

// // // //       {error && !showAddModal && <p className="error-message">{error}</p>}

// // // //       <div className="promotions-content-box">
// // // //         <div className="promotions-cards-grid">
// // // //           {/* Existing Promotion Cards */}
// // // //           {promotions.map(promo => {
// // // //             const business = getBusinessById(promo.businessId);
// // // //             const imageUrl = business?.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image';
// // // //             const proprietorName = business?.proprietorName || 'Unknown Business';

// // // //             return (
// // // //               <div key={promo.id} className="promotion-card">
// // // //                 <div className="promotion-image-container">
// // // //                   <img 
// // // //                     src={imageUrl} 
// // // //                     alt={proprietorName}
// // // //                     onError={(e) => {
// // // //                       e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
// // // //                     }}
// // // //                   />
// // // //                   <div className="promotion-position-badge">
// // // //                     Position: {promo.position}
// // // //                   </div>
// // // //                 </div>
// // // //                 <div className="promotion-info-box">
// // // //                   <h3 className="promotion-business-name">{proprietorName}</h3>
// // // //                   <p className="promotion-business-id">ID: {promo.businessId}</p>
// // // //                 </div>
// // // //                 <button
// // // //                   className="remove-promotion-button"
// // // //                   onClick={() => handleDeletePromotion(promo.id)}
// // // //                   disabled={deletingItemId === promo.id}
// // // //                   title="Remove Promotion"
// // // //                 >
// // // //                   {deletingItemId === promo.id ? (
// // // //                     <span className="spinner-small"></span>
// // // //                   ) : (
// // // //                     'REMOVE'
// // // //                   )}
// // // //                 </button>
// // // //               </div>
// // // //             );
// // // //           })}

// // // //           {/* Add New Promotion Card */}
// // // //           <div className="add-promotion-card" onClick={handleOpenModal}>
// // // //             <div className="add-promotion-content">
// // // //               <div className="add-image-placeholder">
// // // //                 <div className="add-icon-circle">
// // // //                   <span className="add-icon">+</span>
// // // //                 </div>
// // // //                 <p className="add-image-text">ADD PROMOTION</p>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         {promotions.length === 0 && !loading && (
// // // //           <p className="no-promotions-message">No promotions available. Add your first promotion!</p>
// // // //         )}
// // // //       </div>

// // // //       {/* Add Promotion Modal */}
// // // //       {showAddModal && (
// // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // //           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
// // // //             <div className="modal-header">
// // // //               <h2>Add New Promotion</h2>
// // // //               <button className="modal-close-button" onClick={handleCloseModal}>×</button>
// // // //             </div>

// // // //             {error && showAddModal && <p className="modal-error-message">{error}</p>}

// // // //             <form onSubmit={handleSubmitPromotion}>
// // // //               <div className="modal-form-group">
// // // //                 <label htmlFor="business-search">Search Business by Name:</label>
// // // //                 <input
// // // //                   type="text"
// // // //                   id="business-search"
// // // //                   placeholder="Search by proprietor name or business name..."
// // // //                   value={searchTerm}
// // // //                   onChange={(e) => setSearchTerm(e.target.value)}
// // // //                   className="modal-search-input"
// // // //                 />
// // // //               </div>

// // // //               <div className="modal-form-group">
// // // //                 <label htmlFor="business-select">Select Business*:</label>
// // // //                 <select
// // // //                   id="business-select"
// // // //                   value={selectedBusinessId}
// // // //                   onChange={(e) => setSelectedBusinessId(e.target.value)}
// // // //                   className="modal-select"
// // // //                   required
// // // //                 >
// // // //                   <option value="">-- Select a Business --</option>
// // // //                   {filteredBusinesses.map(business => (
// // // //                     <option key={business.id} value={business.id}>
// // // //                       {business.proprietorName || business.businessName} (ID: {business.id})
// // // //                     </option>
// // // //                   ))}
// // // //                 </select>
// // // //                 {filteredBusinesses.length === 0 && searchTerm && (
// // // //                   <p className="no-results-text">No businesses found matching your search.</p>
// // // //                 )}
// // // //               </div>

// // // //               <div className="modal-form-group">
// // // //                 <label htmlFor="position-input">Position*:</label>
// // // //                 <input
// // // //                   type="text"
// // // //                   id="position-input"
// // // //                   placeholder="Enter position (e.g., 1, 2, 3...)"
// // // //                   value={selectedPosition}
// // // //                   onChange={(e) => setSelectedPosition(e.target.value)}
// // // //                   className="modal-input"
// // // //                   required
// // // //                 />
// // // //                 <small className="input-hint">Position determines the order of display (1 = first)</small>
// // // //               </div>

// // // //               <div className="modal-form-actions">
// // // //                 <button 
// // // //                   type="button" 
// // // //                   onClick={handleCloseModal} 
// // // //                   className="modal-cancel-button"
// // // //                   disabled={isSubmitting}
// // // //                 >
// // // //                   Cancel
// // // //                 </button>
// // // //                 <button 
// // // //                   type="submit" 
// // // //                   className="modal-submit-button"
// // // //                   disabled={isSubmitting || !selectedBusinessId || !selectedPosition}
// // // //                 >
// // // //                   {isSubmitting ? (
// // // //                     <>
// // // //                       <span className="spinner-small"></span> Adding...
// // // //                     </>
// // // //                   ) : (
// // // //                     'Add Promotion'
// // // //                   )}
// // // //                 </button>
// // // //               </div>
// // // //             </form>
// // // //           </div>
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // }

// // // // export default Promotions;

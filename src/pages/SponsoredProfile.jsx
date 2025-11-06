import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import "../styles/SponsoredProfile.css";
import {
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../services/apiService";
import { FaTrash, FaSpinner, FaEdit } from "react-icons/fa";

function SponsoredProfile({ isSidebarOpen }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingOfferId, setDeletingOfferId] = useState(null);
  const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerFormData, setOfferFormData] = useState({
    redirectionUrl: "",
    position: "",
    image: null,
    video: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const offersData = await getAllOffers();
      setOffers(offersData || []);
    } catch (err) {
      setError("Failed to load offers.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOfferModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferFormData({
        redirectionUrl: offer.redirectionUrl || "",
        position: offer.position || "",
        image: null,
        video: null,
      });
      setPreviewImage(offer.imageUrl || null);
      setPreviewVideo(offer.videoUrl || null);
    } else {
      setEditingOffer(null);
      setOfferFormData({
        redirectionUrl: "",
        position: "",
        image: null,
        video: null,
      });
      setPreviewImage(null);
      setPreviewVideo(null);
    }
    setShowOfferModal(true);
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(false);
    setEditingOffer(null);
    setOfferFormData({
      redirectionUrl: "",
      position: "",
      image: null,
      video: null,
    });
    setPreviewImage(null);
    setPreviewVideo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOfferFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOfferFormData((prev) => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOfferFormData((prev) => ({ ...prev, video: file }));
      setPreviewVideo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ( !offerFormData.position) {
      setError("Please fill all required fields.");
      return;
    }

    if (!editingOffer && !offerFormData.image && !offerFormData.video) {
      setError("Upload at least one media file (image or video).");
      return;
    }

    setIsOfferSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("redirectionUrl", offerFormData.redirectionUrl);
      formData.append("position", offerFormData.position);
      if (offerFormData.image) formData.append("image", offerFormData.image);
      if (offerFormData.video) formData.append("video", offerFormData.video);

      if (editingOffer) {
        await updateOffer(editingOffer.id, formData);
      } else {
        await createOffer(formData);
      }

      handleCloseOfferModal();
      await fetchOffers();
    } catch (err) {
      setError("Failed to save offer.");
    } finally {
      setIsOfferSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    setDeletingOfferId(id);
    try {
      await deleteOffer(id);
      setOffers((prev) => prev.filter((offer) => offer.id !== id));
    } catch {
      setError("Failed to delete offer.");
    } finally {
      setDeletingOfferId(null);
    }
  };

  if (loading) {
    return (
      <div className={`sponsored-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <PageHeader title="Sponsored Profiles" showBreadcrumb />
        <p className="loading-message">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`sponsored-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <PageHeader title="Sponsored Profiles" showBreadcrumb />
      
      {error && !showOfferModal && (
        <p className="error-message">{error}</p>
      )}

      {/* Main Content Box */}
      <div className="sponsored-content-box">
        <h2 className="section-title">Promotions</h2>
        <div className="sponsored-cards-grid">
          {/* Existing Offer Cards */}
          {offers.map((offer) => (
            <div className="sponsored-card" key={offer.id}>
              <div className="sponsored-image-container">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt="Sponsored Offer" />
                ) : offer.videoUrl ? (
                  <video src={offer.videoUrl} controls />
                ) : (
                  <div className="no-media-placeholder">
                    <span>No Media</span>
                  </div>
                )}
                <div className="sponsored-position-badge">
                  Position: {offer.position}
                </div>
              </div>
              <div className="sponsored-info-box">
                <h3 className="sponsored-title">Sponsored Offer</h3>
                <p className="sponsored-id">ID: {offer.id}</p>
              </div>
              <div className="sponsored-actions">
                <button
                  className="edit-sponsored-button"
                  onClick={() => handleOpenOfferModal(offer)}
                  title="Edit Offer"
                >
                  <FaEdit className="action-icon" />
                  <span className="action-text">Edit</span>
                </button>
                <button
                  className="delete-sponsored-button"
                  onClick={() => handleDeleteOffer(offer.id)}
                  disabled={deletingOfferId === offer.id}
                  title="Delete Offer"
                >
                  {deletingOfferId === offer.id ? (
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
          ))}

          {/* Add New Offer Card */}
          <div className="add-sponsored-card" onClick={() => handleOpenOfferModal()}>
            <div className="add-sponsored-content">
              <div className="add-sponsored-placeholder">
                <div className="add-icon-circle">
                  <span className="add-icon">+</span>
                </div>
                <p className="add-sponsored-text">ADD PROMOTION</p>
              </div>
            </div>
          </div>
        </div>

        {offers.length === 0 && !loading && (
          <p className="no-offers-message">No sponsored offers available. Add your first offer!</p>
        )}
      </div>

      {/* Add/Edit Offer Modal */}
      {showOfferModal && (
        <div className="modal-overlay" onClick={handleCloseOfferModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingOffer ? "Edit Offer" : "Add New Offer"}</h2>
              <button className="modal-close-button" onClick={handleCloseOfferModal}>
                ×
              </button>
            </div>

            {error && showOfferModal && <p className="modal-error-message">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="modal-form-group">
                <label htmlFor="redirectionUrl">Redirection URL:</label>
                <input
                  type="url"
                  id="redirectionUrl"
                  name="redirectionUrl"
                  value={offerFormData.redirectionUrl}
                  onChange={handleInputChange}
                  className="modal-input"
                  placeholder="https://example.com"
                  
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="position">Position*:</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={offerFormData.position}
                  onChange={handleInputChange}
                  className="modal-input"
                  placeholder="Enter position (e.g., 1, 2, 3...)"
                  required
                />
                <small className="input-hint">Position determines the display order (1 = first)</small>
              </div>

              <div className="modal-form-group">
                <label htmlFor="imageUpload">Upload Image (Optional):</label>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="modal-file-input"
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="videoUpload">Upload Video (Optional):</label>
                <input
                  type="file"
                  id="videoUpload"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="modal-file-input"
                />
              </div>

              {(previewImage || previewVideo) && (
                <div className="preview-section">
                  <label>Preview:</label>
                  <div className="preview-gallery">
                    {previewImage && (
                      <div className="media-preview-box">
                        <img src={previewImage} alt="Image Preview" />
                      </div>
                    )}
                    {previewVideo && (
                      <div className="media-preview-box">
                        <video src={previewVideo} controls />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-form-actions">
                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={handleCloseOfferModal}
                  disabled={isOfferSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-button"
                  disabled={isOfferSubmitting || (!offerFormData.position)}
                >
                  {isOfferSubmitting ? (
                    <>
                      <FaSpinner className="spinner-icon" /> Saving...
                    </>
                  ) : editingOffer ? (
                    "Update Offer"
                  ) : (
                    "Add Offer"
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

export default SponsoredProfile;

// import { useState, useEffect } from 'react';
// import PageHeader from '../components/PageHeader';
// import '../styles/Promotions.css';
// import { 
//   getAllOffers,
//   createOffer,
//   updateOffer,
//   deleteOffer
// } from '../services/apiService';
// import { FaTrash, FaSpinner, FaEdit } from 'react-icons/fa';

// function SponsoredProfile({ isSidebarOpen }) {
//   const [offers, setOffers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [deletingOfferId, setDeletingOfferId] = useState(null);
//   const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
//   const [showOfferModal, setShowOfferModal] = useState(false);
//   const [editingOffer, setEditingOffer] = useState(null);
//   const [offerFormData, setOfferFormData] = useState({
//     redirectionUrl: '',
//     position: '',
//     image: null,
//     video: null,
//   });
//   const [previewImage, setPreviewImage] = useState(null);
//   const [previewVideo, setPreviewVideo] = useState(null);

//   useEffect(() => {
//     fetchOffers();
//   }, []);

//   const fetchOffers = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const offersData = await getAllOffers();
//       setOffers(offersData || []);
//     } catch (err) {
//       console.error('Failed to fetch offers:', err);
//       setError(err.message || 'Failed to load offers.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOpenOfferModal = (offer = null) => {
//     if (offer) {
//       setEditingOffer(offer);
//       setOfferFormData({
//         redirectionUrl: offer.redirectionUrl || '',
//         position: offer.position || '',
//         image: null,
//         video: null,
//       });
//       setPreviewImage(offer.imageUrl || null);
//       setPreviewVideo(offer.videoUrl || null);
//     } else {
//       setEditingOffer(null);
//       setOfferFormData({
//         redirectionUrl: '',
//         position: '',
//         image: null,
//         video: null,
//       });
//       setPreviewImage(null);
//       setPreviewVideo(null);
//     }
//     setShowOfferModal(true);
//   };

//   const handleCloseOfferModal = () => {
//     setShowOfferModal(false);
//     setEditingOffer(null);
//     setOfferFormData({
//       redirectionUrl: '',
//       position: '',
//       image: null,
//       video: null,
//     });
//     setPreviewImage(null);
//     setPreviewVideo(null);
//   };

//   const handleOfferInputChange = (e) => {
//     const { name, value } = e.target;
//     setOfferFormData(prev => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setOfferFormData(prev => ({
//         ...prev,
//         image: file,
//       }));
//       setPreviewImage(URL.createObjectURL(file));
//     }
//   };

//   const handleVideoChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setOfferFormData(prev => ({
//         ...prev,
//         video: file,
//       }));
//       setPreviewVideo(URL.createObjectURL(file));
//     }
//   };

//   const handleSubmitOffer = async (e) => {
//     e.preventDefault();
    
//     if (!offerFormData.redirectionUrl || !offerFormData.position) {
//       setError('Please fill in all required fields.');
//       return;
//     }

//     if (!editingOffer && !offerFormData.image && !offerFormData.video) {
//       setError('Please upload at least an image or video.');
//       return;
//     }

//     setIsOfferSubmitting(true);
//     setError(null);

//     try {
//       const submitFormData = new FormData();
//       submitFormData.append('redirectionUrl', offerFormData.redirectionUrl);
//       submitFormData.append('position', offerFormData.position);
      
//       if (offerFormData.image) {
//         submitFormData.append('image', offerFormData.image);
//       }
//       if (offerFormData.video) {
//         submitFormData.append('video', offerFormData.video);
//       }

//       if (editingOffer) {
//         await updateOffer(editingOffer.id, submitFormData);
//       } else {
//         await createOffer(submitFormData);
//       }

//       handleCloseOfferModal();
//       await fetchOffers();
//     } catch (err) {
//       console.error('Failed to submit offer:', err);
//       setError(err.message || 'Failed to submit offer.');
//     } finally {
//       setIsOfferSubmitting(false);
//     }
//   };

//   const handleDeleteOffer = async (offerId) => {
//     if (!window.confirm('Are you sure you want to delete this offer?')) {
//       return;
//     }

//     setDeletingOfferId(offerId);
//     setError(null);

//     try {
//       await deleteOffer(offerId);
//       setOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));
//     } catch (err) {
//       console.error(`Failed to delete offer ${offerId}:`, err);
//       setError(err.message || 'Failed to delete offer.');
//     } finally {
//       setDeletingOfferId(null);
//     }
//   };

//   if (loading && offers.length === 0) {
//     return (
//       <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//         <PageHeader title="Sponsored Profiles" showBreadcrumb={true} />
//         <p className="loading-message">Loading offers...</p>
//       </div>
//     );
//   }

//   return (
//     <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//       <PageHeader title="Sponsored Profiles" showBreadcrumb={true} />
//       {error && !showOfferModal && <p className="error-message">{error}</p>}

//       <div className="section-wrapper">
//         <h2 className="section-title">Offers</h2>
//         <div className="offers-content-box">
//           <div className="offers-cards-grid">
//             {offers.map(offer => (
//               <div key={offer.id} className="offer-card">
//                 <div className="offer-media-container">
//                   {offer.imageUrl ? (
//                     <img 
//                       src={offer.imageUrl} 
//                       alt={`Offer ${offer.id}`}
//                       onError={(e) => e.target.style.display = 'none'}
//                     />
//                   ) : offer.videoUrl ? (
//                     <video 
//                       src={offer.videoUrl}
//                       controls
//                       style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//                     />
//                   ) : (
//                     <div className="no-media-placeholder">
//                       <span>No Media</span>
//                     </div>
//                   )}
//                   <div className="offer-position-badge">
//                     Position: {offer.position}
//                   </div>
//                 </div>
//                 <div className="offer-info-box">
//                   <p className="offer-url">
//                     <strong>URL:</strong> <a href={offer.redirectionUrl} target="_blank" rel="noopener noreferrer">Link</a>
//                   </p>
//                 </div>
//                 <div className="offer-actions">
//                   <button
//                     onClick={() => handleOpenOfferModal(offer)}
//                     className="edit-offer-button"
//                     disabled={isOfferSubmitting}
//                     title="Edit Offer"
//                   >
//                     <FaEdit />
//                   </button>
//                   <button
//                     onClick={() => handleDeleteOffer(offer.id)}
//                     className="delete-offer-button"
//                     disabled={deletingOfferId === offer.id}
//                     title="Delete Offer"
//                   >
//                     {deletingOfferId === offer.id ? (
//                       <FaSpinner className="spinner-icon" />
//                     ) : (
//                       <FaTrash />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             ))}

//             <div className="add-offer-card" onClick={() => handleOpenOfferModal()}>
//               <div className="add-offer-content">
//                 <div className="add-offer-placeholder">
//                   <div className="add-icon-circle">
//                     <span className="add-icon">+</span>
//                   </div>
//                   <p className="add-offer-text">ADD OFFER</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {offers.length === 0 && !loading && (
//             <p className="no-offers-message">No sponsored offers available. Add your first one!</p>
//           )}
//         </div>
//       </div>

//       {showOfferModal && (
//         <div className="modal-overlay" onClick={handleCloseOfferModal}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <h2>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</h2>
//               <button className="modal-close-button" onClick={handleCloseOfferModal}>×</button>
//             </div>

//             {error && showOfferModal && <p className="modal-error-message">{error}</p>}

//             <form onSubmit={handleSubmitOffer}>
//               <div className="modal-form-group">
//                 <label htmlFor="redirectionUrl">Redirection URL*:</label>
//                 <input
//                   type="url"
//                   id="redirectionUrl"
//                   name="redirectionUrl"
//                   placeholder="https://example.com"
//                   value={offerFormData.redirectionUrl}
//                   onChange={handleOfferInputChange}
//                   className="modal-input"
//                   required
//                 />
//               </div>

//               <div className="modal-form-group">
//                 <label htmlFor="offerPosition">Position*:</label>
//                 <input
//                   type="number"
//                   id="offerPosition"
//                   name="position"
//                   placeholder="Enter position (1, 2, 3...)"
//                   value={offerFormData.position}
//                   onChange={handleOfferInputChange}
//                   className="modal-input"
//                   required
//                 />
//                 <small className="input-hint">Position determines the order of display (1 = first)</small>
//               </div>

//               <div className="modal-form-group">
//                 <label htmlFor="image">Image (Optional):</label>
//                 <input
//                   type="file"
//                   id="image"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="modal-file-input"
//                 />
//                 {previewImage && (
//                   <div className="media-preview">
//                     <img src={previewImage} alt="Preview" />
//                   </div>
//                 )}
//               </div>

//               <div className="modal-form-group">
//                 <label htmlFor="video">Video (Optional):</label>
//                 <input
//                   type="file"
//                   id="video"
//                   accept="video/*"
//                   onChange={handleVideoChange}
//                   className="modal-file-input"
//                 />
//                 {previewVideo && (
//                   <div className="media-preview">
//                     <video controls>
//                       <source src={previewVideo} />
//                     </video>
//                   </div>
//                 )}
//               </div>

//               <div className="modal-form-actions">
//                 <button 
//                   type="button" 
//                   onClick={handleCloseOfferModal} 
//                   className="modal-cancel-button"
//                   disabled={isOfferSubmitting}
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   type="submit" 
//                   className="modal-submit-button"
//                   disabled={isOfferSubmitting || !offerFormData.redirectionUrl || !offerFormData.position}
//                 >
//                   {isOfferSubmitting ? (
//                     <>
//                       <FaSpinner className="spinner-icon" /> {editingOffer ? 'Updating...' : 'Adding...'}
//                     </>
//                   ) : (
//                     editingOffer ? 'Update Offer' : 'Add Offer'
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

// export default SponsoredProfile;

// import { useState, useEffect } from 'react';
// import PageHeader from '../components/PageHeader';
// import '../styles/Promotions.css';
// import { 
//   getAllOffers,
//   createOffer,
//   updateOffer,
//   deleteOffer
// } from '../services/apiService';
// import { FaTrash, FaSpinner, FaEdit } from 'react-icons/fa';
// import AlertModal from '../components/AlertModal';

// function SponsoredProfile({ isSidebarOpen }) {
//   const [offers, setOffers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [deletingOfferId, setDeletingOfferId] = useState(null);
//   const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
//   const [showOfferModal, setShowOfferModal] = useState(false);
//   const [editingOffer, setEditingOffer] = useState(null);
//   const [offerFormData, setOfferFormData] = useState({
//     redirectionUrl: '',
//     position: '',
//     image: null,
//     video: null,
//   });
//   const [previewImage, setPreviewImage] = useState(null);
//   const [previewVideo, setPreviewVideo] = useState(null);

//   useEffect(() => {
//     fetchOffers();
//   }, []);

//   const fetchOffers = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const offersData = await getAllOffers();
//       setOffers(offersData || []);
//     } catch (err) {
//       console.error('Failed to fetch offers:', err);
//       setError(err.message || 'Failed to load offers.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOpenOfferModal = (offer = null) => {
//     if (offer) {
//       setEditingOffer(offer);
//       setOfferFormData({
//         redirectionUrl: offer.redirectionUrl || '',
//         position: offer.position || '',
//         image: null,
//         video: null,
//       });
//       setPreviewImage(offer.imageUrl || null);
//       setPreviewVideo(offer.videoUrl || null);
//     } else {
//       setEditingOffer(null);
//       setOfferFormData({
//         redirectionUrl: '',
//         position: '',
//         image: null,
//         video: null,
//       });
//       setPreviewImage(null);
//       setPreviewVideo(null);
//     }
//     setShowOfferModal(true);
//   };

//   const handleCloseOfferModal = () => {
//     setShowOfferModal(false);
//     setEditingOffer(null);
//     setOfferFormData({
//       redirectionUrl: '',
//       position: '',
//       image: null,
//       video: null,
//     });
//     setPreviewImage(null);
//     setPreviewVideo(null);
//   };

//   const handleOfferInputChange = (e) => {
//     const { name, value } = e.target;
//     setOfferFormData(prev => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setOfferFormData(prev => ({
//         ...prev,
//         image: file,
//       }));
//       setPreviewImage(URL.createObjectURL(file));
//     }
//   };

//   const handleVideoChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setOfferFormData(prev => ({
//         ...prev,
//         video: file,
//       }));
//       setPreviewVideo(URL.createObjectURL(file));
//     }
//   };

//   const handleSubmitOffer = async (e) => {
//     e.preventDefault();
    
//     if (!offerFormData.redirectionUrl || !offerFormData.position) {
//       setError('Please fill in all required fields.');
//       return;
//     }

//     if (!editingOffer && !offerFormData.image && !offerFormData.video) {
//       setError('Please upload at least an image or video.');
//       return;
//     }

//     setIsOfferSubmitting(true);
//     setError(null);

//     try {
//       const submitFormData = new FormData();
//       submitFormData.append('redirectionUrl', offerFormData.redirectionUrl);
//       submitFormData.append('position', offerFormData.position);
      
//       if (offerFormData.image) {
//         submitFormData.append('image', offerFormData.image);
//       }
//       if (offerFormData.video) {
//         submitFormData.append('video', offerFormData.video);
//       }

//       if (editingOffer) {
//         await updateOffer(editingOffer.id, submitFormData);
//       } else {
//         await createOffer(submitFormData);
//       }

//       handleCloseOfferModal();
//       await fetchOffers();
//     } catch (err) {
//       console.error('Failed to submit offer:', err);
//       setError(err.message || 'Failed to submit offer.');
//     } finally {
//       setIsOfferSubmitting(false);
//     }
//   };

//   const handleDeleteOffer = async (offerId) => {
//     if (!window.confirm('Are you sure you want to delete this offer?')) {
//       return;
//     }

//     setDeletingOfferId(offerId);
//     setError(null);

//     try {
//       await deleteOffer(offerId);
//       setOffers(prevOffers => 
//         prevOffers.filter(offer => offer.id !== offerId)
//       );
//     } catch (err) {
//       console.error(`Failed to delete offer ${offerId}:`, err);
//       setError(err.message || 'Failed to delete offer.');
//     } finally {
//       setDeletingOfferId(null);
//     }
//   };

//   if (loading && offers.length === 0) {
//     return (
//       <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//         <PageHeader title="Sponsored Profiles" showBreadcrumb={true} />
//         <p className="loading-message">Loading offers...</p>
//       </div>
//     );
//   }

//   return (
//     <div className={`promotions-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//       <PageHeader title="Sponsored Profiles" showBreadcrumb={true} />
//       {error && !showOfferModal && <p className="error-message">{error}</p>}

//       <div className="section-wrapper">
//         <h2 className="section-title">Offers</h2>
//         <div className="offers-content-box">
//           <div className="offers-cards-grid">
//             {offers.map(offer => (
//               <div key={offer.id} className="offer-card">
//                 <div className="offer-media-container">
//                   {offer.imageUrl ? (
//                     <img 
//                       src={offer.imageUrl} 
//                       alt={`Offer ${offer.id}`}
//                       onError={(e) => e.target.style.display = 'none'}
//                     />
//                   ) : offer.videoUrl ? (
//                     <video 
//                       src={offer.videoUrl}
//                       controls
//                       style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//                     />
//                   ) : (
//                     <div className="no-media-placeholder">
//                       <span>No Media</span>
//                     </div>
//                   )}
//                   <div className="offer-position-badge">
//                     Position: {offer.position}
//                   </div>
//                 </div>
//                 <div className="offer-info-box">
//                   <p className="offer-url">
//                     <strong>URL:</strong> <a href={offer.redirectionUrl} target="_blank" rel="noopener noreferrer">Link</a>
//                   </p>
//                 </div>
//                 <div className="offer-actions">
//                   <button
//                     onClick={() => handleOpenOfferModal(offer)}
//                     className="edit-offer-button"
//                     disabled={isOfferSubmitting}
//                     title="Edit Offer"
//                   >
//                     <FaEdit />
//                   </button>
//                   <button
//                     onClick={() => handleDeleteOffer(offer.id)}
//                     className="delete-offer-button"
//                     disabled={deletingOfferId === offer.id}
//                     title="Delete Offer"
//                   >
//                     {deletingOfferId === offer.id ? (
//                       <FaSpinner className="spinner-icon" />
//                     ) : (
//                       <FaTrash />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             ))}

//             <div className="add-offer-card" onClick={() => handleOpenOfferModal()}>
//               <div className="add-offer-content">
//                 <div className="add-offer-placeholder">
//                   <div className="add-icon-circle">
//                     <span className="add-icon">+</span>
//                   </div>
//                   <p className="add-offer-text">ADD OFFER</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {offers.length === 0 && !loading && (
//             <p className="no-offers-message">No sponsored offers available. Add your first one!</p>
//           )}
//         </div>
//       </div>

//       {showOfferModal && (
//         <div className="modal-overlay" onClick={handleCloseOfferModal}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <h2>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</h2>
//               <button className="modal-close-button" onClick={handleCloseOfferModal}>×</button>
//             </div>

//             {error && showOfferModal && <p className="modal-error-message">{error}</p>}

//             <form onSubmit={handleSubmitOffer}>
//               <div className="modal-form-group">
//                 <label htmlFor="redirectionUrl">Redirection URL*:</label>
//                 <input
//                   type="url"
//                   id="redirectionUrl"
//                   name="redirectionUrl"
//                   placeholder="https://example.com"
//                   value={offerFormData.redirectionUrl}
//                   onChange={handleOfferInputChange}
//                   className="modal-input"
//                   required
//                 />
//               </div>

//               <div className="modal-form-group">
//                 <label htmlFor="offerPosition">Position*:</label>
//                 <input
//                   type="number"
//                   id="offerPosition"
//                   name="position"
//                   placeholder="Enter position (1, 2, 3...)"
//                   value={offerFormData.position}
//                   onChange={handleOfferInputChange}
//                   className="modal-input"
//                   required
//                 />
//                 <small className="input-hint">Position determines the order of display (1 = first)</small>
//               </div>

//               <div className="modal-form-group">
//                 <label htmlFor="image">Image (Optional):</label>
//                 <input
//                   type="file"
//                   id="image"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="modal-file-input"
//                 />
//                 {previewImage && (
//                   <div className="media-preview">
//                     <img src={previewImage} alt="Preview" />
//                   </div>
//                 )}
//               </div>

//               <div className="modal-form-group">
//                 <label htmlFor="video">Video (Optional):</label>
//                 <input
//                   type="file"
//                   id="video"
//                   accept="video/*"
//                   onChange={handleVideoChange}
//                   className="modal-file-input"
//                 />
//                 {previewVideo && (
//                   <div className="media-preview">
//                     <video controls>
//                       <source src={previewVideo} />
//                     </video>
//                   </div>
//                 )}
//               </div>

//               <div className="modal-form-actions">
//                 <button 
//                   type="button" 
//                   onClick={handleCloseOfferModal} 
//                   className="modal-cancel-button"
//                   disabled={isOfferSubmitting}
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   type="submit" 
//                   className="modal-submit-button"
//                   disabled={isOfferSubmitting || !offerFormData.redirectionUrl || !offerFormData.position}
//                 >
//                   {isOfferSubmitting ? (
//                     <>
//                       <FaSpinner className="spinner-icon" /> {editingOffer ? 'Updating...' : 'Adding...'}
//                     </>
//                   ) : (
//                     editingOffer ? 'Update Offer' : 'Add Offer'
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

// export default SponsoredProfile;

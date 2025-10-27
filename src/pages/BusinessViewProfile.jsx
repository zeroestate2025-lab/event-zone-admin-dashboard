import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/BusinessViewProfile.css';
import { 
  getAllBusinessPartners, 
  updateBusinessDetailsAPI,
  uploadBusinessImage, // Make sure this is in your apiService.js
  deleteBusinessImage  // Make sure this is in your apiService.js
} from '../services/apiService';
import { 
  FaPlus, FaTrash, FaSpinner, FaEdit, FaTimes, FaImage, 
  FaMapMarkerAlt, FaPhone, FaGlobe, FaClock, FaSave 
  // Add any other icons you use from react-icons like MdCategory, MdDescription etc. if not already here
} from 'react-icons/fa'; 

function BusinessViewProfile({ isSidebarOpen }) {
  const { businessId } = useParams(); 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: businessId, 
    businessName: "",
    proprietorName: "",
    price: "",
    serviceProvided: "",
    location: "",
    state: "",
    district: "",
    pincode: "",
    phoneNumber: "",
    email: "",
    moreDetails: "", 
    isApproved: false,
    subCategories: [], 
    aproxLatitude: "", 
    aproxLongitude: "", 
    images: [], 

  });
  const [initialFormData, setInitialFormData] = useState(null); 
  const [customDetails, setCustomDetails] = useState([{ name: '', detail: '' }]); 
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);

  if (!businessId || isNaN(parseInt(businessId))) {
    return (
      <div className={`profile-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="profile-view-header">
            <h1 className="header-main-title">Invalid Business ID</h1>
        </div>
        <p style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>
            No valid Business ID provided in the URL.
        </p>
        <p style={{ textAlign: 'center' }}>Please go back and select a valid business profile.</p>
        <button onClick={() => navigate(-1)} className="action-button error-back-button" style={{ display: 'block', margin: '20px auto' }}>
          Back
        </button>
      </div>
    );
  }

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMessage('');
      try {
        const maindetails = await getAllBusinessPartners(); 
        const details = maindetails.find(item => item.id === Number(businessId));

        let legacyMoreDetailsString = ""; 
        let newCustomDetailsArray = [{ name: '', detail: '' }]; 

        if (details && details.moreDetails) {
          if (typeof details.moreDetails === 'string') {
            try {
              const parsed = JSON.parse(details.moreDetails);
              if (Array.isArray(parsed)) {
                newCustomDetailsArray = parsed.length > 0 ? parsed : [{ name: '', detail: '' }];
              } else {
                legacyMoreDetailsString = details.moreDetails;
              }
            } catch (e) {
              legacyMoreDetailsString = details.moreDetails;
            }
          } else if (Array.isArray(details.moreDetails)) {
            newCustomDetailsArray = details.moreDetails.length > 0 ? details.moreDetails : [{ name: '', detail: '' }];
          }
        }

        if (details && typeof details === 'object' && Object.keys(details).length > 0) {
          const mappedDetails = {
            id: details.id || businessId,
            businessName: details.businessName || details.BusinessName || details.business_name || "",
            proprietorName: details.proprietorName || "",
            price: details.price || "",
            serviceProvided: details.serviceProvided || "",
            location: details.location || "",
            state: details.state || "",
            district: details.district || "",
            pincode: details.pincode || "",
            phoneNumber: details.phoneNumber || "",
            email: details.email || "",
            moreDetails: legacyMoreDetailsString,
            isApproved: typeof details.isApproved === 'boolean' ? details.isApproved : (typeof details.IsApproved === 'boolean' ? details.IsApproved : (typeof details.is_approved === 'boolean' ? details.is_approved : false)),
            subCategories: Array.isArray(details.subCategories) ? details.subCategories : (Array.isArray(details.SubCategories) ? details.SubCategories : (Array.isArray(details.sub_categories) ? details.sub_categories : [])),
            aproxLatitude: details.aproxLatitude !== undefined ? String(details.aproxLatitude) : "",
            aproxLongitude: details.aproxLongitude !== undefined ? String(details.aproxLongitude) : "",
            images: Array.isArray(details.images) ? details.images.map(img => (typeof img === 'string' ? { url: img, id: null } : (img.url ? img : {url: img, id: null}))) : [],
          };
          setFormData(mappedDetails);
          setCustomDetails(newCustomDetailsArray);
          setInitialFormData({ ...mappedDetails, customDetails: newCustomDetailsArray });
        } else {
          setError(`Business details not found for ID: ${businessId}.`);
          setFormData(prev => ({ ...prev, id: businessId })); 
          setInitialFormData(null);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch business details.");
        setInitialFormData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [businessId]); 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');
    try {
      const filteredCustomDetails = customDetails.filter(cd => cd.name && cd.detail);
      // Ensure all images have an ID, if some were added optimistically and ID was null,
      // your backend needs to handle this or you need to ensure IDs are always present.
      const imagesToSend = formData.images.map(img => ({ 
        id: img.id, // This might be null for very new images if not handled perfectly by upload response
        url: img.url 
      }));
        
      const payload = {
        ...formData,
        moreDetails: JSON.stringify(filteredCustomDetails), 
        images: imagesToSend, 
      };
      await updateBusinessDetailsAPI(businessId, payload); 
      setSuccessMessage("Business details updated successfully!");
      // After successful save, update initialFormData to reflect the new saved state
      // This includes the newly saved images.

      const newFormData = {
  ...formData,
  images: formData.images.map((item) => ({
    ...item,
    isdeletedisable: false
  }))
};
 setFormData(newFormData)
      setInitialFormData({
        ...newFormData, // current form field values, including potentially new images
        moreDetails: "", 
        customDetails: filteredCustomDetails
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update business details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1); 
  };

  const handleEditToggle = () => {
    if (isEditing && initialFormData) {
      const { customDetails: initialCustom, ...initialForm } = initialFormData;
      setFormData(initialForm);
      setCustomDetails(initialCustom || [{ name: '', detail: '' }]);
    }
    setIsEditing(!isEditing);
    setError(null); 
    setSuccessMessage('');
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');
    try {
      const filteredCustomDetails = customDetails.filter(cd => cd.name && cd.detail);
      const imagesToSend = formData.images.map(img => ({ id: img.id, url: img.url }));
      const updatedData = { 
        ...formData, 
        isApproved: true,
        moreDetails: JSON.stringify(filteredCustomDetails), 
        images: imagesToSend,
      };
      await updateBusinessDetailsAPI(businessId, updatedData); 
      setFormData(prev => ({...prev, isApproved: true})); 
      setInitialFormData({
        ...formData, 
        isApproved: true,
        moreDetails: "", 
        customDetails: filteredCustomDetails
      });
      setSuccessMessage("Business approved successfully!");
    } catch (err) {
      setError(err.message || "Failed to approve business.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoreDetailChange = (index, event) => {
    const { name, value } = event.target;
    const updatedCustomDetails = customDetails.map((item, i) =>
      i === index ? { ...item, [name]: value } : item
    );
    setCustomDetails(updatedCustomDetails);
  };

  const handleAddMoreDetailField = () => {
    setCustomDetails(prevDetails => [
      ...prevDetails,
      { name: '', detail: '' },
    ]);
  };

  const handleRemoveMoreDetailField = (index) => {
    if (customDetails.length <= 1 && !customDetails[0]?.name && !customDetails[0]?.detail) {
        return; 
    }
    setCustomDetails(customDetails.filter((_, i) => i !== index));
  };

  const handleOpenImageModal = (url, index) => {
    setSelectedImageUrl(url);
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageUrl('');
  };

  const handleNextImage = () => {
    if (formData.images && formData.images.length > 0) {
      const nextIndex = (currentImageIndex + 1) % formData.images.length;
      setCurrentImageIndex(nextIndex);
      setSelectedImageUrl(formData.images[nextIndex].url);
    }
  };

  const handlePrevImage = () => {
    if (formData.images && formData.images.length > 0) {
      const prevIndex = (currentImageIndex - 1 + formData.images.length) % formData.images.length;
      setCurrentImageIndex(prevIndex);
      setSelectedImageUrl(formData.images[prevIndex].url);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !businessId) return;

    setImageUploading(true);
    setSuccessMessage('');
    setError(null);

    try {
      const newImage = await uploadBusinessImage(file, businessId); 
    // It MUST be an object like { id: "someId", url: "someUrl" } for the single uploaded image
      // for the optimistic update to work correctly.
      console.log('BusinessViewProfile: Received from uploadBusinessImage service (raw):', newImage); 
      console.log('BusinessViewProfile: Type of newImage.id:', typeof newImage?.id, 'Value:', newImage?.id);
      console.log('BusinessViewProfile: Type of newImage.url:', typeof newImage?.url, 'Value:', newImage?.url);
       setFormData(prevFormData => {
          const updatedImages = [...(prevFormData.images || []), 
        {
         id: prevFormData.images.length + 1,
         url: URL.createObjectURL(file),
         isdeletedisable:true
        }];
          return {
            ...prevFormData,
            images: updatedImages
          };
        });
      // if (newImage && typeof newImage.url === 'string' && newImage.url.trim() !== '' && (typeof newImage.id === 'string' || typeof newImage.id === 'number') && newImage.id !== null && newImage.id !== undefined) {
      //   const newImageObject = { id: newImage.id, url: newImage.url };
      //   setFormData(prevFormData => {
      //     const updatedImages = [...(prevFormData.images || []), newImageObject];
      //     return {
      //       ...prevFormData,
      //       images: updatedImages
      //     };
      //   });
      //   setSuccessMessage('Image uploaded successfully! It will be fully saved when you click "Save Changes".');
      // } else {
      //   console.error('Uploaded image data is not in expected format:', newImage);
      //   setError('Failed to process uploaded image data. API did not return expected format.');
      // }
    } catch (err) {
      console.error('Error uploading image:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload image.';
      setError(errorMessage);
    } finally {
      setImageUploading(false);
      if (event.target) { 
        event.target.value = null;
      }
    }
  };


  const handleDeleteImage = async (imageIdToDelete) => {
    if (!imageIdToDelete || !window.confirm('Are you sure you want to delete this image?')) return;

    setDeletingImageId(imageIdToDelete);
    setSuccessMessage('');
    setError(null);

    try {
      await deleteBusinessImage(imageIdToDelete); 
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(image => image.id !== imageIdToDelete)
      }));
      setSuccessMessage('Image deleted successfully!');
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete image.');
    } finally {
      setDeletingImageId(null);
    }
  };

  const subCategoryOptions = [
    "Venue", "Catering Service", "Decorator", 
    "Photographer",  "Music Band", "DJ", "Bridal Wear", 
    "Groom Wear", "Makeup Artist", "Hair Stylist", "Invitations", 
    "Wedding Cake", "Transportation", "Return Gifts", 
  ];

  const serviceOptions = [
    "All", "Wedding", "Reception", "Brithday", 
    "Anniversary", "Corporate Event", "Puberty Function"
  ];

  const editableFields = [
    { name: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Enter business name' },
    { name: 'proprietorName', label: 'Proprietor Name', type: 'text', placeholder: 'Enter proprietor name' },
    { name: 'serviceProvided', label: 'Service Provided', type: 'select', options: serviceOptions },
    { name: 'price', label: 'Approx. Price (INR)', type: 'number', placeholder: 'e.g., 10000' },
    { name: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit phone number' },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter contact email' },
    { name: 'location', label: 'Full Address', type: 'textarea', placeholder: 'Enter full street address' },
    { name: 'district', label: 'District', type: 'text', placeholder: 'e.g., Coimbatore' },
    { name: 'state', label: 'State', type: 'text', placeholder: 'e.g., Tamil Nadu' },
    { name: 'pincode', label: 'Pincode', type: 'text', placeholder: 'e.g., 641004' },
    { name: 'aproxLatitude', label: 'Approx. Latitude', type: 'text', placeholder: 'e.g., 11.03' },
    { name: 'aproxLongitude', label: 'Approx. Longitude', type: 'text', placeholder: 'e.g., 76.98' },
  ];

  function renderField(fieldName) {
    const field = editableFields.find(f => f.name === fieldName);
    if (!field) return null; 

    const value = formData[field.name];

    return (
      <div className={`form-group ${field.type === 'textarea' ? 'textarea-full-width' : ''}`} key={field.name}>
        <label htmlFor={field.name}>{field.label}</label>
        {!isEditing ? (
          <span>
            {(value !== null && value !== undefined && value !== '' ? String(value) : 'N/A')}
          </span>
        ) : field.type === 'textarea' ? (
            <textarea
              id={field.name}
              name={field.name}
              value={value || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              rows={field.name === 'location' ? 3 : 4}
              disabled={isSubmitting}
            />
          ) : field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={value || ''}
              onChange={handleChange}
              disabled={isSubmitting}
              className="form-select"
            >
              <option value="" disabled>{`Select ${field.label}`}</option>
              {field.options && field.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : ( 
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={value || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              disabled={isSubmitting}
            />
          )
        }
      </div>
    );
  }

  const handleSubCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prevData => {
      const currentSubCategories = prevData.subCategories || [];
      if (checked) {
        return { ...prevData, subCategories: [...new Set([...currentSubCategories, value])] };
      } else {
        return { ...prevData, subCategories: currentSubCategories.filter(sc => sc !== value) };
      }
    });
  };

  if (isLoading) {
    return (
      <div className={`profile-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="profile-view-header">
          <h1 className="header-main-title">Loading Business Profile...</h1>
        </div>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>Fetching details, please wait...</p>
      </div>
    );
  }

  if (error && !initialFormData) {
    return (
      <div className={`profile-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="profile-view-header">
          <h1 className="header-main-title">Error</h1>
        </div>
        <p style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>{error}</p>
        <button onClick={handleBack} className="action-button error-back-button" style={{ display: 'block', margin: '20px auto' }}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className={`profile-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="profile-view-header">
        <button type="button" className="header-action-button back-button-header" onClick={handleBack}>
          ← Back
        </button>
        <h1 className="header-main-title">Business Profile</h1>
        <button type="button" className="header-action-button edit-button-header" onClick={handleEditToggle} disabled={isLoading || isSubmitting || !initialFormData}>
          {isEditing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit</>}
        </button>
      </div>

      {successMessage && <p className="success-message">{successMessage}</p>}
      {error && (!isEditing || (isEditing && !initialFormData)) && <p className="error-message">{error}</p>}

      {initialFormData ? ( 
        <form onSubmit={handleSubmit} className="profile-form">
          <fieldset className="form-section">
            <legend>Basic Information</legend>
            <div className="form-row-grid">
              {renderField('businessName')}
              {renderField('proprietorName')}
              {renderField('serviceProvided')}
              {renderField('price')}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Contact Information</legend>
            <div className="form-row-grid">
              {renderField('phoneNumber')}
              {renderField('email')}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Location Information</legend>
            {renderField('location')}
            <div className="form-row-grid">
              {renderField('district')}
              {renderField('state')}
              {renderField('pincode')}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Additional Details</legend>
            {formData.moreDetails && (
              <div className="form-group legacy-more-details">
                <label>Legacy Additional Details (Read-only):</label>
                <p className="read-only-text">{formData.moreDetails}</p>
              </div>
            )}

            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Custom Details:</label>
            {isEditing && (
              <p style={{ fontSize: '0.95em', color: '#555', marginTop: '-5px', marginBottom: '10px' }}>
                <em>Note: For Google Maps links, use "gmap" as the Detail Name, then paste the link as the Detail Value.</em>
              </p>
            )}           
            {!isEditing ? (
              Array.isArray(customDetails) && customDetails.some(item => item.name && item.detail) ? (
                customDetails.map((item, index) =>
                  item.name && item.detail ? (
                    <div key={index} className="form-group more-detail-item-view">
                      <strong className="custom-detail-name">{item.name}:</strong>
                      <span>{item.detail}</span>
                    </div>
                  ) : null
                )
              ) : (
                <div className="form-group"><span>N/A</span></div>
              )
            ) : (
              <>
                {customDetails.map((item, index) => (
                  <div key={index} className="custom-detail-editor-item">
                    <input
                      type="text"
                      name="name"
                      className="custom-detail-input-name"
                      placeholder="Detail Name (e.g., Seating)"
                      value={item.name}
                      onChange={(e) => handleMoreDetailChange(index, e)}
                      disabled={isSubmitting}
                    />
                    <input
                      type="text"
                      name="detail"
                      className="custom-detail-input-value"
                      placeholder="Detail Value (e.g., 500 guests)"
                      value={item.detail}
                      onChange={(e) => handleMoreDetailChange(index, e)}
                      disabled={isSubmitting}
                    />
                    {(customDetails.length > 1 || (customDetails.length === 1 && (item.name || item.detail))) && (
                    <button type="button" onClick={() => handleRemoveMoreDetailField(index)} className="remove-detail-button" disabled={isSubmitting}>
                      &times;
                    </button>
                    )}
                  </div>
                ))}
              </>
            )}
            {isEditing && (
              <button type="button" onClick={handleAddMoreDetailField} className="add-detail-button" disabled={isSubmitting}>
                <FaPlus /> Add Custom Detail
              </button>
            )}
            <div className="form-group">
              <label>Sub-Categories:</label>
              {!isEditing ? (
                <span>
                  {Array.isArray(formData.subCategories) && formData.subCategories.length > 0
                     ? formData.subCategories.join(', ')
                    : 'N/A'}
                </span>
              ) : (
                <div className="subcategories-checkbox-group">
                  {subCategoryOptions.map(option => (
                    <div key={option} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`subcategory-${option.replace(/\s+/g, '-')}`} 
                        name="subCategories"
                        value={option}
                        checked={(formData.subCategories || []).includes(option)}
                        onChange={handleSubCategoryChange}
                        disabled={isSubmitting}
                        className="form-checkbox"
                      />
                      <label htmlFor={`subcategory-${option.replace(/\s+/g, '-')}`}>
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Geographical Coordinates</legend>
            <div className="form-row-grid">
              {renderField('aproxLatitude')}
              {renderField('aproxLongitude')}
            </div>
          </fieldset>
          <fieldset className="form-section">
            <legend>Admin Controls</legend>
            <div className="form-group">
              <label htmlFor="isApproved">Approval Status</label>
              {!isEditing ? (
                <span>{formData.isApproved ? 'Yes' : 'No'}</span>
              ) : (
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="isApproved"
                    name="isApproved"
                    checked={Boolean(formData.isApproved)}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend><FaImage /> Business Images</legend>
            {formData.images && formData.images.length > 0 ? (
              <div className="images-gallery">
                {formData.images.map((image, index) => (
                  <div key={image.id || `image-${index}`} className="image-item">
                    <img 
                      src={image.url} 
                      alt={`${formData.businessName || 'Business'} - Image ${index + 1}`} 
                      onError={(e) => { e.target.style.display='none'; }}
                      onClick={() => handleOpenImageModal(image.url, index)}
                      style={{ cursor: 'pointer' }}
                    />
                    {isEditing && image.id && !image.isdeletedisable &&( 
                      <button
                        type="button"
                        className="delete-image-button"
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={deletingImageId === image.id || isSubmitting}
                        title="Delete Image"
                      >
                        {deletingImageId === image.id ? <FaSpinner className="spinner" /> : <FaTrash />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No images available for this business.</p>
            )}
            {isEditing && (
              <div className="add-photo-section">
                <input 
                  type="file" id="imageUploadInput" 
                  accept="image/*" 
                  onChange={handleImageUpload} style={{ display: 'none' }} 
                  disabled={imageUploading || isSubmitting} />
                <label htmlFor="imageUploadInput" className={`button-like-add-photo ${imageUploading || isSubmitting ? 'disabled' : ''}`}>
                  {imageUploading ? <><FaSpinner className="spinner" /> Uploading...</> : <><FaPlus /> Add Photo</>}
                </label>
              </div>
            )}
          </fieldset>

          {!formData.isApproved && !isEditing && (
            <div className="form-actions centered-actions">
              <button
                type="button"
                onClick={handleApprove}
                className="action-button approve-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? <><FaSpinner className="spinner" /> Approving...</> : 'Approve Business'}
              </button>
            </div>
          )}
          {isEditing && (
            <div className="form-actions">
              <button type="submit" className="action-button submit-button" disabled={isSubmitting || isLoading || imageUploading || deletingImageId}>
                {isSubmitting ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Changes</>}
              </button>
            </div>
          )}
          {error && isEditing && <p className="error-message" style={{ marginTop: '10px' }}>{error}</p>}
        </form>
      ) : (
        !isLoading && <p className="error-message">Could not load business details. Please try again or contact support.</p>
      )}

      {isImageModalOpen && (
        <div className="image-modal-overlay" onClick={handleCloseImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close-button" onClick={handleCloseImageModal}>&times;</button>
             {formData.images && formData.images.length > 1 && (
              <>
                <button className="image-nav-button prev" onClick={handlePrevImage}>
                  &#10094; 
                </button>
                <button className="image-nav-button next" onClick={handleNextImage}>
                  &#10095; 
                </button>
              </>
            )}
            <img src={selectedImageUrl} alt="Enlarged business view" className="enlarged-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessViewProfile;


// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import '../styles/BusinessViewProfile.css';
// import { 
//   getAllBusinessPartners, 
//   updateBusinessDetailsAPI,
//   uploadBusinessImage, // Make sure this is in your apiService.js
//   deleteBusinessImage  // Make sure this is in your apiService.js
// } from '../services/apiService';
// import { 
//   FaPlus, FaTrash, FaSpinner, FaEdit, FaTimes, FaImage, 
//   FaMapMarkerAlt, FaPhone, FaGlobe, FaClock, FaSave 
//   // Add any other icons you use from react-icons like MdCategory, MdDescription etc. if not already here
// } from 'react-icons/fa'; 

// function BusinessViewProfile({ isSidebarOpen }) {
//   const { businessId } = useParams(); 
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     id: businessId, 
//     businessName: "",
//     proprietorName: "",
//     price: "",
//     serviceProvided: "",
//     location: "",
//     state: "",
//     district: "",
//     pincode: "",
//     phoneNumber: "",
//     email: "",
//     moreDetails: "", 
//     isApproved: false,
//     subCategories: [], 
//     aproxLatitude: "", 
//     aproxLongitude: "", 
//     images: [], 
//   });
//   const [initialFormData, setInitialFormData] = useState(null); 
//   const [customDetails, setCustomDetails] = useState([{ name: '', detail: '' }]); 
//   const [isEditing, setIsEditing] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [isImageModalOpen, setIsImageModalOpen] = useState(false);
//   const [selectedImageUrl, setSelectedImageUrl] = useState('');
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [imageUploading, setImageUploading] = useState(false);
//   const [deletingImageId, setDeletingImageId] = useState(null);

//   if (!businessId || isNaN(parseInt(businessId))) {
//     return (
//       <div className={`profile-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//         <div className="profile-view-header">
//             <h1 className="header-main-title">Invalid Business ID</h1>
//         </div>
//         <p style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>
//             No valid Business ID provided in the URL.
//         </p>
//         <p style={{ textAlign: 'center' }}>Please go back and select a valid business profile.</p>
//         <button onClick={() => navigate(-1)} className="action-button error-back-button" style={{ display: 'block', margin: '20px auto' }}>
//           Back
//         </button>
//       </div>
//     );
//   }

//   useEffect(() => {
//     const fetchDetails = async () => {
//       setIsLoading(true);
//       setError(null);
//       setSuccessMessage('');
//       try {
//         const maindetails = await getAllBusinessPartners(); 
//         const details = maindetails.find(item => item.id === Number(businessId));

//         let legacyMoreDetailsString = ""; 
//         let newCustomDetailsArray = [{ name: '', detail: '' }]; 

//         if (details && details.moreDetails) {
//           if (typeof details.moreDetails === 'string') {
//             try {
//               const parsed = JSON.parse(details.moreDetails);
//               if (Array.isArray(parsed)) {
//                 newCustomDetailsArray = parsed.length > 0 ? parsed : [{ name: '', detail: '' }];
//               } else {
//                 legacyMoreDetailsString = details.moreDetails;
//               }
//             } catch (e) {
//               legacyMoreDetailsString = details.moreDetails;
//             }
//           } else if (Array.isArray(details.moreDetails)) {
//             newCustomDetailsArray = details.moreDetails.length > 0 ? details.moreDetails : [{ name: '', detail: '' }];
//           }
//         }

//         if (details && typeof details === 'object' && Object.keys(details).length > 0) {
//           const mappedDetails = {
//             id: details.id || businessId,
//             businessName: details.businessName || details.BusinessName || details.business_name || "",
//             proprietorName: details.proprietorName || "",
//             price: details.price || "",
//             serviceProvided: details.serviceProvided || "",
//             location: details.location || "",
//             state: details.state || "",
//             district: details.district || "",
//             pincode: details.pincode || "",
//             phoneNumber: details.phoneNumber || "",
//             email: details.email || "",
//             moreDetails: legacyMoreDetailsString,
//             isApproved: typeof details.isApproved === 'boolean' ? details.isApproved : (typeof details.IsApproved === 'boolean' ? details.IsApproved : (typeof details.is_approved === 'boolean' ? details.is_approved : false)),
//             subCategories: Array.isArray(details.subCategories) ? details.subCategories : (Array.isArray(details.SubCategories) ? details.SubCategories : (Array.isArray(details.sub_categories) ? details.sub_categories : [])),
//             aproxLatitude: details.aproxLatitude !== undefined ? String(details.aproxLatitude) : "",
//             aproxLongitude: details.aproxLongitude !== undefined ? String(details.aproxLongitude) : "",
//             images: Array.isArray(details.images) ? details.images.map(img => (typeof img === 'string' ? { url: img, id: null } : (img.url ? img : {url: img, id: null}))) : [],
//           };
//           setFormData(mappedDetails);
//           setCustomDetails(newCustomDetailsArray);
//           setInitialFormData({ ...mappedDetails, customDetails: newCustomDetailsArray });
//         } else {
//           setError(`Business details not found for ID: ${businessId}.`);
//           setFormData(prev => ({ ...prev, id: businessId })); 
//           setInitialFormData(null);
//         }
//       } catch (err) {
//         setError(err.message || "Failed to fetch business details.");
//         setInitialFormData(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchDetails();
//   }, [businessId]); 

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prevData => ({
//       ...prevData,
//       [name]: type === 'checkbox' ? checked : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError(null);
//     setSuccessMessage('');
//     try {
//       const filteredCustomDetails = customDetails.filter(cd => cd.name && cd.detail);
//       const payload = {
//         ...formData,
//         moreDetails: JSON.stringify(filteredCustomDetails), 
//         images: formData.images.map(img => ({ id: img.id, url: img.url })), 
//       };
//       await updateBusinessDetailsAPI(businessId, payload); 
//       setSuccessMessage("Business details updated successfully!");
//       setInitialFormData({
//         ...formData, 
//         moreDetails: "", 
//         customDetails: filteredCustomDetails
//       });
//       setIsEditing(false);
//     } catch (err) {
//       setError(err.message || "Failed to update business details.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleBack = () => {
//     navigate(-1); 
//   };

//   const handleEditToggle = () => {
//     if (isEditing && initialFormData) {
//       const { customDetails: initialCustom, ...initialForm } = initialFormData;
//       setFormData(initialForm);
//       setCustomDetails(initialCustom || [{ name: '', detail: '' }]);
//     }
//     setIsEditing(!isEditing);
//     setError(null); 
//     setSuccessMessage('');
//   };

//   const handleApprove = async () => {
//     setIsSubmitting(true);
//     setError(null);
//     setSuccessMessage('');
//     try {
//       const filteredCustomDetails = customDetails.filter(cd => cd.name && cd.detail);
//       const updatedData = { 
//         ...formData, 
//         isApproved: true,
//         moreDetails: JSON.stringify(filteredCustomDetails), 
//         images: formData.images.map(img => ({ id: img.id, url: img.url })),
//       };
//       await updateBusinessDetailsAPI(businessId, updatedData); 
//       setFormData(prev => ({...prev, isApproved: true})); 
//       setInitialFormData({
//         ...formData, 
//         isApproved: true,
//         moreDetails: "", 
//         customDetails: filteredCustomDetails
//       });
//       setSuccessMessage("Business approved successfully!");
//     } catch (err) {
//       setError(err.message || "Failed to approve business.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleMoreDetailChange = (index, event) => {
//     const { name, value } = event.target;
//     const updatedCustomDetails = customDetails.map((item, i) =>
//       i === index ? { ...item, [name]: value } : item
//     );
//     setCustomDetails(updatedCustomDetails);
//   };

//   const handleAddMoreDetailField = () => {
//     setCustomDetails(prevDetails => [
//       ...prevDetails,
//       { name: '', detail: '' },
//     ]);
//   };

//   const handleRemoveMoreDetailField = (index) => {
//     if (customDetails.length <= 1 && !customDetails[0]?.name && !customDetails[0]?.detail) {
//         return; 
//     }
//     setCustomDetails(customDetails.filter((_, i) => i !== index));
//   };

//   const handleOpenImageModal = (url, index) => {
//     setSelectedImageUrl(url);
//     setCurrentImageIndex(index);
//     setIsImageModalOpen(true);
//   };

//   const handleCloseImageModal = () => {
//     setIsImageModalOpen(false);
//     setSelectedImageUrl('');
//   };

//   const handleNextImage = () => {
//     if (formData.images && formData.images.length > 0) {
//       const nextIndex = (currentImageIndex + 1) % formData.images.length;
//       setCurrentImageIndex(nextIndex);
//       setSelectedImageUrl(formData.images[nextIndex].url);
//     }
//   };

//   const handlePrevImage = () => {
//     if (formData.images && formData.images.length > 0) {
//       const prevIndex = (currentImageIndex - 1 + formData.images.length) % formData.images.length;
//       setCurrentImageIndex(prevIndex);
//       setSelectedImageUrl(formData.images[prevIndex].url);
//     }
//   };

//   const handleImageUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file || !businessId) return;

//     setImageUploading(true);
//     setSuccessMessage('');
//     setError(null);

//     try {
//       const newImage = await uploadBusinessImage(file, businessId); 
//       console.log('Uploaded image data:', newImage);
//      if (newImage && newImage.url && newImage.id) {
//   const newImageObject = { id: newImage.id, url: newImage.url };
//   setFormData(prev => {
//     const updatedImages = [...(prev.images || []), newImageObject];
//     // Optionally update initialFormData here if uploads are considered persistent immediately
//     // setInitialFormData(prevInitial => ({
//     //   ...prevInitial,
//     //   images: [...(prevInitial.images || []), newImageObject]
//     // }));
//     return {
//       ...prev,
//       images: updatedImages
//     };
//   });
//   setSuccessMessage('Image uploaded successfully!');
// } else {
//         console.error('Uploaded image data is not in expected format:', newImage);
//         setError('Failed to process uploaded image data. API did not return expected format.');
//       }
//     } catch (err) {
//       console.error('Error uploading image:', err);
//       setError(err.response?.data?.message || err.message || 'Failed to upload image.');
//     } finally {
//       setImageUploading(false);
//       if (event.target) { 
//         event.target.value = null;
//       }
//     }
//   };

//   const handleDeleteImage = async (imageIdToDelete) => {
//     if (!imageIdToDelete || !window.confirm('Are you sure you want to delete this image?')) return;

//     setDeletingImageId(imageIdToDelete);
//     setSuccessMessage('');
//     setError(null);

//     try {
//       await deleteBusinessImage(imageIdToDelete); 
//       setFormData(prev => ({
//         ...prev,
//         images: prev.images.filter(image => image.id !== imageIdToDelete)
//       }));
//       setSuccessMessage('Image deleted successfully!');
//     } catch (err) {
//       console.error('Error deleting image:', err);
//       setError(err.response?.data?.message || err.message || 'Failed to delete image.');
//     } finally {
//       setDeletingImageId(null);
//     }
//   };

//   const subCategoryOptions = [
//     "Venue", "Catering Service", "Decorator", 
//     "Photographer",  "Music Band", "DJ", "Bridal Wear", 
//     "Groom Wear", "Makeup Artist", "Hair Stylist", "Invitations", 
//     "Wedding Cake", "Transportation", "Return Gifts", 
//   ];

//   const serviceOptions = [
//     "All", "Wedding", "Reception", "Brithday", 
//     "Anniversary", "Corporate Event", "Puberty Function"
//   ];

//   const editableFields = [
//     { name: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Enter business name' },
//     { name: 'proprietorName', label: 'Proprietor Name', type: 'text', placeholder: 'Enter proprietor name' },
//     { name: 'serviceProvided', label: 'Service Provided', type: 'select', options: serviceOptions },
//     { name: 'price', label: 'Approx. Price (INR)', type: 'number', placeholder: 'e.g., 10000' },
//     { name: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit phone number' },
//     { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter contact email' },
//     { name: 'location', label: 'Full Address', type: 'textarea', placeholder: 'Enter full street address' },
//     { name: 'district', label: 'District', type: 'text', placeholder: 'e.g., Coimbatore' },
//     { name: 'state', label: 'State', type: 'text', placeholder: 'e.g., Tamil Nadu' },
//     { name: 'pincode', label: 'Pincode', type: 'text', placeholder: 'e.g., 641004' },
//     { name: 'aproxLatitude', label: 'Approx. Latitude', type: 'text', placeholder: 'e.g., 11.03' },
//     { name: 'aproxLongitude', label: 'Approx. Longitude', type: 'text', placeholder: 'e.g., 76.98' },
//   ];

//   function renderField(fieldName) {
//     const field = editableFields.find(f => f.name === fieldName);
//     if (!field) return null; 

//     const value = formData[field.name];

//     return (
//       <div className={`form-group ${field.type === 'textarea' ? 'textarea-full-width' : ''}`} key={field.name}>
//         <label htmlFor={field.name}>{field.label}</label>
//         {!isEditing ? (
//           <span>
//             {(value !== null && value !== undefined && value !== '' ? String(value) : 'N/A')}
//           </span>
//         ) : field.type === 'textarea' ? (
//             <textarea
//               id={field.name}
//               name={field.name}
//               value={value || ''}
//               onChange={handleChange}
//               placeholder={field.placeholder}
//               rows={field.name === 'location' ? 3 : 4}
//               disabled={isSubmitting}
//             />
//           ) : field.type === 'select' ? (
//             <select
//               id={field.name}
//               name={field.name}
//               value={value || ''}
//               onChange={handleChange}
//               disabled={isSubmitting}
//               className="form-select"
//             >
//               <option value="" disabled>{`Select ${field.label}`}</option>
//               {field.options && field.options.map(option => (
//                 <option key={option} value={option}>{option}</option>
//               ))}
//             </select>
//           ) : ( 
//             <input
//               type={field.type}
//               id={field.name}
//               name={field.name}
//               value={value || ''}
//               onChange={handleChange}
//               placeholder={field.placeholder}
//               disabled={isSubmitting}
//             />
//           )
//         }
//       </div>
//     );
//   }

//   const handleSubCategoryChange = (e) => {
//     const { value, checked } = e.target;
//     setFormData(prevData => {
//       const currentSubCategories = prevData.subCategories || [];
//       if (checked) {
//         return { ...prevData, subCategories: [...new Set([...currentSubCategories, value])] };
//       } else {
//         return { ...prevData, subCategories: currentSubCategories.filter(sc => sc !== value) };
//       }
//     });
//   };

//   if (isLoading) {
//     return (
//       <div className={`profile-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//         <div className="profile-view-header">
//           <h1 className="header-main-title">Loading Business Profile...</h1>
//         </div>
//         <p style={{ textAlign: 'center', marginTop: '20px' }}>Fetching details, please wait...</p>
//       </div>
//     );
//   }

//   if (error && !initialFormData) {
//     return (
//       <div className={`profile-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//         <div className="profile-view-header">
//           <h1 className="header-main-title">Error</h1>
//         </div>
//         <p style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>{error}</p>
//         <button onClick={handleBack} className="action-button error-back-button" style={{ display: 'block', margin: '20px auto' }}>
//           Back
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className={`profile-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//       <div className="profile-view-header">
//         <button type="button" className="header-action-button back-button-header" onClick={handleBack}>
//           ← Back
//         </button>
//         <h1 className="header-main-title">Business Profile</h1>
//         <button type="button" className="header-action-button edit-button-header" onClick={handleEditToggle} disabled={isLoading || isSubmitting || !initialFormData}>
//           {isEditing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit</>}
//         </button>
//       </div>

//       {successMessage && <p className="success-message">{successMessage}</p>}
//       {error && (!isEditing || (isEditing && !initialFormData)) && <p className="error-message">{error}</p>}

//       {initialFormData ? ( 
//         <form onSubmit={handleSubmit} className="profile-form">
//           <fieldset className="form-section">
//             <legend>Basic Information</legend>
//             <div className="form-row-grid">
//               {renderField('businessName')}
//               {renderField('proprietorName')}
//               {renderField('serviceProvided')}
//               {renderField('price')}
//             </div>
//           </fieldset>

//           <fieldset className="form-section">
//             <legend>Contact Information</legend>
//             <div className="form-row-grid">
//               {renderField('phoneNumber')}
//               {renderField('email')}
//             </div>
//           </fieldset>

//           <fieldset className="form-section">
//             <legend>Location Information</legend>
//             {renderField('location')}
//             <div className="form-row-grid">
//               {renderField('district')}
//               {renderField('state')}
//               {renderField('pincode')}
//             </div>
//           </fieldset>

//           <fieldset className="form-section">
//             <legend>Additional Details</legend>
//             {formData.moreDetails && (
//               <div className="form-group legacy-more-details">
//                 <label>Legacy Additional Details (Read-only):</label>
//                 <p className="read-only-text">{formData.moreDetails}</p>
//               </div>
//             )}

//             <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Custom Details:</label>
//             {!isEditing ? (
//               Array.isArray(customDetails) && customDetails.some(item => item.name && item.detail) ? (
//                 customDetails.map((item, index) =>
//                   item.name && item.detail ? (
//                     <div key={index} className="form-group more-detail-item-view">
//                       <strong className="custom-detail-name">{item.name}:</strong>
//                       <span>{item.detail}</span>
//                     </div>
//                   ) : null
//                 )
//               ) : (
//                 <div className="form-group"><span>N/A</span></div>
//               )
//             ) : (
//               <>
//                 {customDetails.map((item, index) => (
//                   <div key={index} className="custom-detail-editor-item">
//                     <input
//                       type="text"
//                       name="name"
//                       className="custom-detail-input-name"
//                       placeholder="Detail Name (e.g., Seating)"
//                       value={item.name}
//                       onChange={(e) => handleMoreDetailChange(index, e)}
//                       disabled={isSubmitting}
//                     />
//                     <input
//                       type="text"
//                       name="detail"
//                       className="custom-detail-input-value"
//                       placeholder="Detail Value (e.g., 500 guests)"
//                       value={item.detail}
//                       onChange={(e) => handleMoreDetailChange(index, e)}
//                       disabled={isSubmitting}
//                     />
//                     {(customDetails.length > 1 || (customDetails.length === 1 && (item.name || item.detail))) && (
//                     <button type="button" onClick={() => handleRemoveMoreDetailField(index)} className="remove-detail-button" disabled={isSubmitting}>
//                       &times;
//                     </button>
//                     )}
//                   </div>
//                 ))}
//               </>
//             )}
//             {isEditing && (
//               <button type="button" onClick={handleAddMoreDetailField} className="add-detail-button" disabled={isSubmitting}>
//                 <FaPlus /> Add Custom Detail
//               </button>
//             )}
//             <div className="form-group">
//               <label>Sub-Categories:</label>
//               {!isEditing ? (
//                 <span>
//                   {Array.isArray(formData.subCategories) && formData.subCategories.length > 0
//                      ? formData.subCategories.join(', ')
//                     : 'N/A'}
//                 </span>
//               ) : (
//                 <div className="subcategories-checkbox-group">
//                   {subCategoryOptions.map(option => (
//                     <div key={option} className="checkbox-item">
//                       <input
//                         type="checkbox"
//                         id={`subcategory-${option.replace(/\s+/g, '-')}`} 
//                         name="subCategories"
//                         value={option}
//                         checked={(formData.subCategories || []).includes(option)}
//                         onChange={handleSubCategoryChange}
//                         disabled={isSubmitting}
//                         className="form-checkbox"
//                       />
//                       <label htmlFor={`subcategory-${option.replace(/\s+/g, '-')}`}>
//                         {option}
//                       </label>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </fieldset>

//           <fieldset className="form-section">
//             <legend>Geographical Coordinates</legend>
//             <div className="form-row-grid">
//               {renderField('aproxLatitude')}
//               {renderField('aproxLongitude')}
//             </div>
//           </fieldset>
//           <fieldset className="form-section">
//             <legend>Admin Controls</legend>
//             <div className="form-group">
//               <label htmlFor="isApproved">Approval Status</label>
//               {!isEditing ? (
//                 <span>{formData.isApproved ? 'Yes' : 'No'}</span>
//               ) : (
//                 <div className="checkbox-wrapper">
//                   <input
//                     type="checkbox"
//                     id="isApproved"
//                     name="isApproved"
//                     checked={Boolean(formData.isApproved)}
//                     onChange={handleChange}
//                     className="form-checkbox"
//                     disabled={isSubmitting}
//                   />
//                 </div>
//               )}
//             </div>
//           </fieldset>

//           <fieldset className="form-section">
//             <legend><FaImage /> Business Images</legend>
//             {formData.images && formData.images.length > 0 ? (
//               <div className="images-gallery">
//                 {formData.images.map((image, index) => (
//                   <div key={image.id || `image-${index}`} className="image-item">
//                     <img 
//                       src={image.url} 
//                       alt={`${formData.businessName || 'Business'} - Image ${index + 1}`} 
//                       onError={(e) => { e.target.style.display='none'; }}
//                       onClick={() => handleOpenImageModal(image.url, index)}
//                       style={{ cursor: 'pointer' }}
//                     />
//                     {isEditing && image.id && ( 
//                       <button
//                         type="button"
//                         className="delete-image-button"
//                         onClick={() => handleDeleteImage(image.id)}
//                         disabled={deletingImageId === image.id || isSubmitting}
//                         title="Delete Image"
//                       >
//                         {deletingImageId === image.id ? <FaSpinner className="spinner" /> : <FaTrash />}
//                       </button>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p>No images available for this business.</p>
//             )}
//             {isEditing && (
//               <div className="add-photo-section">
//                 <input 
//                   type="file" id="imageUploadInput" 
//                   accept="image/*" 
//                   onChange={handleImageUpload} style={{ display: 'none' }} 
//                   disabled={imageUploading || isSubmitting} />
//                 <label htmlFor="imageUploadInput" className={`button-like-add-photo ${imageUploading || isSubmitting ? 'disabled' : ''}`}>
//                   {imageUploading ? <><FaSpinner className="spinner" /> Uploading...</> : <><FaPlus /> Add Photo</>}
//                 </label>
//               </div>
//             )}
//           </fieldset>

//           {!formData.isApproved && !isEditing && (
//             <div className="form-actions centered-actions">
//               <button
//                 type="button"
//                 onClick={handleApprove}
//                 className="action-button approve-button"
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? <><FaSpinner className="spinner" /> Approving...</> : 'Approve Business'}
//               </button>
//             </div>
//           )}
//           {isEditing && (
//             <div className="form-actions">
//               <button type="submit" className="action-button submit-button" disabled={isSubmitting || isLoading || imageUploading || deletingImageId}>
//                 {isSubmitting ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Changes</>}
//               </button>
//             </div>
//           )}
//           {error && isEditing && <p className="error-message" style={{ marginTop: '10px' }}>{error}</p>}
//         </form>
//       ) : (
//         !isLoading && <p className="error-message">Could not load business details. Please try again or contact support.</p>
//       )}

//       {isImageModalOpen && (
//         <div className="image-modal-overlay" onClick={handleCloseImageModal}>
//           <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
//             <button className="image-modal-close-button" onClick={handleCloseImageModal}>&times;</button>
//              {formData.images && formData.images.length > 1 && (
//               <>
//                 <button className="image-nav-button prev" onClick={handlePrevImage}>
//                   &#10094; 
//                 </button>
//                 <button className="image-nav-button next" onClick={handleNextImage}>
//                   &#10095; 
//                 </button>
//               </>
//             )}
//             <img src={selectedImageUrl} alt="Enlarged business view" className="enlarged-image" />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default BusinessViewProfile;



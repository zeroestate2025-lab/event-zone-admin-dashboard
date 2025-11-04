import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { getAllBusinessPartners } from '../services/apiService';
import '../styles/Event.css';

function Events({ isSidebarOpen }) {
  const navigate = useNavigate();
  
  const [events] = useState([
    { id: '001', name: 'Wedding', essentials: 'Venue, Catering, Decoration' },
    { id: '002', name: 'Birthday', essentials: 'Venue, Catering, Entertainment' },
    { id: '003', name: 'Baby Shower', essentials: 'Venue, Catering, Decoration' },
    { id: '004', name: 'Corporate events', essentials: 'Venue, Catering, Audio Visual' },
    { id: '005', name: 'Puberty', essentials: 'Venue, Catering, Decoration' },
    { id: '006', name: 'House Warming', essentials: 'Venue, Catering, Decoration' },
  ]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCategoryClick = async (categoryName) => {
    setSelectedCategory(categoryName);
    setLoading(true);
    
    try {
      const allPartners = await getAllBusinessPartners();
      console.log('All Partners:', allPartners);
      const filteredPartners = allPartners.filter(
        partner => partner.serviceProvided === categoryName
      );
      console.log('Filtered Partners:', filteredPartners);
      setPartners(filteredPartners);
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setPartners([]);
  };

  const parseMoreDetails = (moreDetailsString) => {
    try {
      return JSON.parse(moreDetailsString);
    } catch {
      return [];
    }
  };

  return (
    <div className={`events-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <PageHeader title="EVENTS" showBreadcrumb={true} />

      <div className="events-content">
        <div className="events-table-container">
          <table className="events-table">
            <thead>
              <tr>
                <th>CATEGORY ID</th>
                <th>CATEGORY NAME</th>
                <th>Event Essential</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr 
                  key={index} 
                  onClick={() => handleCategoryClick(event.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{event.id}</td>
                  <td>{event.name}</td>
                  <td>{event.essentials}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCategory && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCategory} - Available Partners</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-content">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading partners...</p>
                </div>
              ) : partners.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                  </svg>
                  <p>No partners available for this category</p>
                </div>
              ) : (
                <div className="partners-grid">
                  {partners.map((partner) => {
                    const moreDetails = parseMoreDetails(partner.moreDetails);
                    
                    return (
                      <div key={partner.id} className="partner-card">
                        <div className="partner-image-section">
                          {partner.images && partner.images.length > 0 ? (
                            <img 
                              src={partner.images[0].url} 
                              alt={partner.businessName}
                              className="partner-image"
                            />
                          ) : (
                            <div className="partner-image-placeholder">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                              </svg>
                            </div>
                          )}
                          <div className="partner-status-overlay">
                            {/* <span className={`status-badge ${partner.isApproved ? 'approved' : 'pending'}`}>
                              {partner.isApproved ? '✓ Approved' : '⏳ Pending'}
                            </span> */}
                          </div>
                        </div>
                        
                        <div className="partner-info-section">
                          <div className="partner-header">
                            <h3 className="partner-name">{partner.businessName}</h3>
                            <p className="partner-price">₹{Number(partner.price).toLocaleString('en-IN')}</p>
                          </div>

                          <div className="partner-location-row">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>{partner.location}</span>
                          </div>

                          {partner.subCategories && partner.subCategories.length > 0 && (
                            <div className="partner-subcategories">
                              {partner.subCategories.map((sub, idx) => (
                                <span key={idx} className="subcategory-tag">{sub}</span>
                              ))}
                            </div>
                          )}

                          <div className="partner-contact-grid">
                            <div className="contact-item">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                              <div>
                                <span className="contact-label">Phone:</span>
                                <span className="contact-value">{partner.phoneNumber}</span>
                              </div>
                            </div>

                            <div className="contact-item">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              <div>
                                <span className="contact-label">District:</span>
                                <span className="contact-value">{partner.district}</span>
                              </div>
                            </div>
                          </div>

                          <div className="partner-details-section">
                            <h4 className="details-heading">Venue Details</h4>
                            <div className="details-grid">
                              {moreDetails.slice(0, 6).map((detail, idx) => (
                                detail.name !== 'gmap' && (
                                  <div key={idx} className="detail-row">
                                    <span className="detail-label">{detail.name}</span>
                                    <span className="detail-value">{detail.detail}</span>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>

                          <div className="partner-actions">
                            {/* <button className="btn-view-details">View Full Details</button> */}
                            {moreDetails.find(d => d.name === 'gmap') && (
                              <button 
                                className="btn-view-map"
                                onClick={() => window.open(moreDetails.find(d => d.name === 'gmap').detail, '_blank')}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                  <circle cx="12" cy="10" r="3"/>
                                </svg>
                                View on Map
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import PageHeader from '../components/PageHeader';
// import '../styles/Event.css';

// function Events({ isSidebarOpen }) {
//   const navigate = useNavigate();
  
//   const [events, setEvents] = useState([
//     { id: '001', name: 'Wedding', essentials: 'Metals, Cattering ...' },
//     { id: '002', name: 'Birthday', essentials: 'Metals, Cattering ...' },
//     { id: '003', name: 'Baby Shower', essentials: 'Metals, Cattering ...' },
//     { id: '004', name: 'Corporate events', essentials: 'Metals, Cattering ...' },
//     { id: '005', name: 'Puberty', essentials: 'Metals, Cattering ...' },
//     { id: '006', name: 'House Warming', essentials: 'Metals, Cattering ...' },
//     { id: '005', name: 'Puberty', essentials: 'Metals, Cattering ...' },
//   ]);

//   return (
//     <div className={`events-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//       <PageHeader title="EVENTS" showBreadcrumb={true} />

//       <div className="events-content">
//         <div className="events-table-container">
//           <table className="events-table">
//             <thead>
//               <tr>
//                 <th>CATEGORY ID</th>
//                 <th>CATEGORY NAME</th>
//                 <th>Event Essential</th>
//               </tr>
//             </thead>
//             <tbody>
//               {events.map((event, index) => (
//                 <tr key={index}>
//                   <td>{event.id}</td>
//                   <td>{event.name}</td>
//                   <td>{event.essentials}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Events;

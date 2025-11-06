import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import '../styles/Dashboard.css';
import { getUserCount, getBusinessPartnerCount, getAllPayments } from '../services/apiService';

function Dashboard({ isSidebarOpen }) {
  const [userCount, setUserCount] = useState(0);
  const [businessCount, setBusinessCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Animated subscription counter state
  const [displayAmount, setDisplayAmount] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const uCount = await getUserCount();
        setUserCount(uCount);

        const bCount = await getBusinessPartnerCount();
        setBusinessCount(bCount);
      } catch (err) {
        console.error("Dashboard: Failed to fetch dashboard data:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch and animate subscription total
  useEffect(() => {
    const fetchSubscriptionTotal = async () => {
      try {
        const payments = await getAllPayments();
        
        // Filter only successful payments and convert from paise to rupees
        const successfulPayments = payments.filter(p => 
          p.status?.toLowerCase() === 'success' || 
          p.status?.toLowerCase() === 'paid' ||
          p.status?.toLowerCase() === 'completed'
        );
        
        const totalAmount = successfulPayments.reduce((sum, p) => sum + ((p.amount || 0) / 100), 0);
        
        // Clear any existing animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        // Reset display amount
        setDisplayAmount(0);

        // Animation duration
        const duration = 2000;
        const startTime = Date.now();
        const startAmount = 0;

        const animate = () => {
          const currentTime = Date.now();
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function
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
      } catch (err) {
        console.error("Failed to fetch subscription total:", err);
      }
    };

    fetchSubscriptionTotal();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <PageHeader title="Home" showBreadcrumb={false} />
      
      {error && <p className="error-message">Error fetching data: {error}</p>}
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <Link to="/user-management" className="stat-card-link">
          <div className="stat-card">
            <p>Total Users</p>
            <h2>{loading ? 'Loading...' : userCount}</h2>
            <span className="arrow">→</span>
          </div>
        </Link>
        
        <Link to="/business" className="stat-card-link">
          <div className="stat-card">
            <p>Vendors</p>
            <h2>{loading ? 'Loading...' : businessCount}</h2>
            <span className="arrow">→</span>
          </div>
        </Link>
        
        <Link to="/subscriptions" className="stat-card-link">
          <div className="stat-card">
            <p>Subscription</p>
            <h2>₹{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</h2>
            <span className="arrow">→</span>
          </div>
        </Link>
      </div>

      {/* Action Cards */}
      <div className="action-grid">
        <Link to="/events" className="action-card-link">
          <div className="action-card">
            <h3>EVENTS</h3>
            <span className="arrow">→</span>
          </div>
        </Link>
        
        <Link to="/promotions" className="action-card-link">
          <div className="action-card">
            <h3>PROMOTIONS</h3>
            <span className="arrow">→</span>
          </div>
        </Link>
        
        <Link to="/pending-approvals" className="action-card-link">
          <div className="action-card">
            <h3>PENDING APPROVALS</h3>
            <span className="arrow">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;

// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import PageHeader from '../components/PageHeader';
// import '../styles/Dashboard.css';
// import { getUserCount, getBusinessPartnerCount } from '../services/apiService';

// function Dashboard({ isSidebarOpen }) {
//   const [userCount, setUserCount] = useState(0);
//   const [businessCount, setBusinessCount] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const uCount = await getUserCount();
//         setUserCount(uCount);

//         const bCount = await getBusinessPartnerCount();
//         setBusinessCount(bCount);
//       } catch (err) {
//         console.error("Dashboard: Failed to fetch dashboard data:", err);
//         setError(err.message || "Failed to load dashboard data.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   return (
//     <div className={`dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
//       <PageHeader title="Home" showBreadcrumb={false} />
      
//       {error && <p className="error-message">Error fetching data: {error}</p>}
      
//       {/* Stats Cards */}
//       <div className="stats-grid">
//         <Link to="/user-management" className="stat-card-link">
//           <div className="stat-card">
//             <p>Total Users</p>
//             <h2>{loading ? 'Loading...' : userCount}</h2>
//             <span className="arrow">→</span>
//           </div>
//         </Link>
        
//         <Link to="/business" className="stat-card-link">
//           <div className="stat-card">
//             <p>Vendors</p>
//             <h2>{loading ? 'Loading...' : businessCount}</h2>
//             <span className="arrow">→</span>
//           </div>
//         </Link>
        
//         <Link to="/subscriptions" className="stat-card-link">
//           <div className="stat-card">
//             <p>Subscription</p>
//             <h2>₹508300</h2>
//             <span className="arrow">→</span>
//           </div>
//         </Link>
//       </div>

//       {/* Action Cards */}
//       <div className="action-grid">
//         <Link to="/events" className="action-card-link">
//           <div className="action-card">
//             <h3>EVENTS</h3>
//             <span className="arrow">→</span>
//           </div>
//         </Link>
        
//         <Link to="/promotions" className="action-card-link">
//           <div className="action-card">
//             <h3>PROMOTIONS</h3>
//             <span className="arrow">→</span>
//           </div>
//         </Link>
        
//         <Link to="/pending-approvals" className="action-card-link">
//           <div className="action-card">
//             <h3>PENDING APPROVALS</h3>
//             <span className="arrow">→</span>
//           </div>
//         </Link>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;

// // import { useState, useEffect } from 'react';
// // import { Link } from 'react-router-dom';
// // import '../styles/Dashboard.css';
// // import { getUserCount, getBusinessPartnerCount} from '../services/apiService'; // Import API functions

// // function Dashboard({ isSidebarOpen }) {
// //   const [userCount, setUserCount] = useState(0);
// //   const [businessCount, setBusinessCount] = useState(0);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// // useEffect(() => {
// //   const fetchData = async () => {
// //     setLoading(true);
// //     setError(null);
// //     console.log("Dashboard: Starting data fetch...");
// //     try {
// //       const uCount = await getUserCount();
// //       console.log("Dashboard: Fetched User Count API Response:", uCount);
// //       setUserCount(uCount);

// //       const bCount = await getBusinessPartnerCount();
// //       console.log("Dashboard: Fetched Business Partner Count API Response:", bCount);
// //       setBusinessCount(bCount);

// //     } catch (err) {
// //       console.error("Dashboard: Failed to fetch dashboard data:", err);
// //       setError(err.message || "Failed to load dashboard data.");
// //     } finally {
// //       console.log("Dashboard: Fetch complete, setting loading to false.");
// //       setLoading(false);
// //     }
// //   };
// //   fetchData();
// // }, []);

// //   return (
// //     <div className={`dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
// //       <h1>Home</h1>
// //       {error && <p className="error-message">Error fetching data: {error}</p>}
// //       {/* Stats Cards */}
// //       <div className="stats-grid">
// //         <div className="stat-card">
// //           <p>Total Users</p>
// //           <h2>{loading ? 'Loading...' : userCount}</h2>
// //         </div>
// //         <div className="stat-card">
// //           <p>Vendors</p>
// //           <h2>{loading ? 'Loading...' : businessCount}</h2>
// //         </div>
// //         <div className="stat-card">
// //           <p>Subscription</p>
// //           <h2>$508300</h2>
// //         </div>
// //       </div>

// //       {/* Action Cards */}
// //       <div className="action-grid">
// //         <div className="action-card">
// //           <Link to="/events" style={{ color: 'inherit', textDecoration: 'none' }}>
// //             <h3>Events</h3>
// //             <span>→</span>
// //           </Link>
// //         </div>
// //         <div className="action-card">
// //           <Link to="/promotions" style={{ color: 'inherit', textDecoration: 'none' }}>
// //             <h3>Promotions</h3>
// //             <span>→</span>
// //           </Link>
// //         </div>
// //         <div className="action-card">
// //           <Link to="/pending-approvals" style={{ color: 'inherit', textDecoration: 'none' }}>
// //             <h3>Pending Approvals</h3>
// //             <span>→</span>
// //           </Link>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // export default Dashboard;
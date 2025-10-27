import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';
import { getUserCount, getBusinessPartnerCount} from '../services/apiService'; // Import API functions

function Dashboard({ isSidebarOpen }) {
  const [userCount, setUserCount] = useState(0);
  const [businessCount, setBusinessCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    console.log("Dashboard: Starting data fetch...");
    try {
      const uCount = await getUserCount();
      console.log("Dashboard: Fetched User Count API Response:", uCount);
      setUserCount(uCount);

      const bCount = await getBusinessPartnerCount();
      console.log("Dashboard: Fetched Business Partner Count API Response:", bCount);
      setBusinessCount(bCount);

    } catch (err) {
      console.error("Dashboard: Failed to fetch dashboard data:", err);
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      console.log("Dashboard: Fetch complete, setting loading to false.");
      setLoading(false);
    }
  };
  fetchData();
}, []);

  return (
    <div className={`dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <h1>Home</h1>
      {error && <p className="error-message">Error fetching data: {error}</p>}
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <p>Total Users</p>
          <h2>{loading ? 'Loading...' : userCount}</h2>
        </div>
        <div className="stat-card">
          <p>Vendors</p>
          <h2>{loading ? 'Loading...' : businessCount}</h2>
        </div>
        <div className="stat-card">
          <p>Subscription</p>
          <h2>$508300</h2>
        </div>
      </div>

      {/* Action Cards */}
      <div className="action-grid">
        <div className="action-card">
          <Link to="/events" style={{ color: 'inherit', textDecoration: 'none' }}>
            <h3>Events</h3>
            <span>→</span>
          </Link>
        </div>
        <div className="action-card">
          <Link to="/promotions" style={{ color: 'inherit', textDecoration: 'none' }}>
            <h3>Promotions</h3>
            <span>→</span>
          </Link>
        </div>
        <div className="action-card">
          <Link to="/pending-approvals" style={{ color: 'inherit', textDecoration: 'none' }}>
            <h3>Pending Approvals</h3>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
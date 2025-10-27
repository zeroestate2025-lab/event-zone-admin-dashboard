
function Events({ isSidebarOpen }) {
    return (
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <h1>Events Page</h1>
        <p>This is a placeholder for the Events page.</p>
      </div>
    );
  }

  export default Events;
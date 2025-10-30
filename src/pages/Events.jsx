import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import '../styles/Event.css';

function Events({ isSidebarOpen }) {
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([
    { id: '001', name: 'Wedding', essentials: 'Metals, Cattering ...' },
    { id: '002', name: 'Birthday', essentials: 'Metals, Cattering ...' },
    { id: '003', name: 'Baby Shower', essentials: 'Metals, Cattering ...' },
    { id: '004', name: 'Corporate events', essentials: 'Metals, Cattering ...' },
    { id: '005', name: 'Puberty', essentials: 'Metals, Cattering ...' },
    { id: '006', name: 'House Warming', essentials: 'Metals, Cattering ...' },
    { id: '005', name: 'Puberty', essentials: 'Metals, Cattering ...' },
  ]);

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
                <tr key={index}>
                  <td>{event.id}</td>
                  <td>{event.name}</td>
                  <td>{event.essentials}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Events;

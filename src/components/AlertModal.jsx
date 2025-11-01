import React from 'react';
import './AlertModal.css';

const AlertModal = ({ isOpen, type, message, onClose }) => {
  if (!isOpen) return null;

  const alertTypes = {
    success: {
      icon: '✓',
      className: 'success',
      title: 'Success'
    },
    error: {
      icon: '✕',
      className: 'error',
      title: 'Error'
    },
    warning: {
      icon: '!',
      className: 'warning',
      title: 'Warning'
    },
    info: {
      icon: 'i',
      className: 'info',
      title: 'Information'
    }
  };

  const { icon, className, title } = alertTypes[type] || alertTypes.info;

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal-content" onClick={e => e.stopPropagation()}>
        <div className={`alert-modal-header ${className}`}>
          <span className="alert-modal-icon">{icon}</span>
          <h3>{title}</h3>
          <button className="alert-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="alert-modal-body">
          <p>{message}</p>
        </div>
        <div className="alert-modal-footer">
          <button className={`alert-modal-button ${className}`} onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
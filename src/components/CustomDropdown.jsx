import { useState } from 'react';
import '../styles/CustomDropdown.css'; // You'll need to create this CSS file

function CustomDropdown({ label, selectedValue, options, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelectOption = (value) => {
        onSelect(value);
        setIsOpen(false);
    };

    return (
        <div className="custom-dropdown-wrapper">
            <div className="dropdown-header" onClick={toggleDropdown}>
                {selectedValue || label} <span className="dropdown-arrow">▼</span>
            </div>
            {isOpen && (
                <ul className="dropdown-options">
                    {options.map((option) => (
                        <li
                            key={option}
                            className="dropdown-option"
                            onClick={() => handleSelectOption(option)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default CustomDropdown;
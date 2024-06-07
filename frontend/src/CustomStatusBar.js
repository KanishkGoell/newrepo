import React, { useState, useEffect, useRef } from 'react';
import './CustomStatusBar.css'; // Ensure you have a corresponding CSS file

const CustomStatusBar = ({ gridApi, filterPresets, setFilterPresets, savePreferences, isLoggedIn }) => {
    const [newPresetName, setNewPresetName] = useState('');
    const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [presetToDelete, setPresetToDelete] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('');
    const deleteDropdownRef = useRef(null);

    useEffect(() => {
        const savedPreset = sessionStorage.getItem('selectedPreset');
        if (savedPreset && savedPreset in filterPresets) {
            applyFilterPreset(savedPreset);
            setSelectedPreset(savedPreset);
        }

        const handleClickOutside = (event) => {
            if (deleteDropdownRef.current && !deleteDropdownRef.current.contains(event.target)) {
                setShowDeleteDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [filterPresets]);

    const resetFilters = () => {
        if (gridApi) {
            gridApi.setFilterModel({});
            setSelectedPreset('');
            sessionStorage.removeItem('selectedPreset');
        }
    };

    const saveFilterPreset = () => {
        if (gridApi && newPresetName) {
            const currentFilters = gridApi.getFilterModel();
            const updatedFilterPresets = { ...filterPresets, [newPresetName]: currentFilters };
            setFilterPresets(updatedFilterPresets);
            savePreferences(updatedFilterPresets, {}); // Save preferences to backend
            setNewPresetName('');
        }
    };

    const applyFilterPreset = (presetName) => {
        if (gridApi && presetName in filterPresets) {
            gridApi.setFilterModel(filterPresets[presetName]);
            setSelectedPreset(presetName);
            sessionStorage.setItem('selectedPreset', presetName);
        }
    };

    const handleDeletePreset = () => {
        const updatedFilterPresets = { ...filterPresets };
        delete updatedFilterPresets[presetToDelete];
        setFilterPresets(updatedFilterPresets);
        savePreferences(updatedFilterPresets, {}); // Save preferences to backend
        setShowDeleteModal(false);
        if (presetToDelete === selectedPreset) {
            setSelectedPreset('');
            sessionStorage.removeItem('selectedPreset');
        }
    };

    return (
        <div className="status-bar">
            <select
                className="status-bar-select"
                value={selectedPreset}
                onChange={e => applyFilterPreset(e.target.value)}
            >
                <option>Select a filter preset</option>
                {Object.keys(filterPresets).map(presetName => (
                    <option key={presetName} value={presetName}>{presetName}</option>
                ))}
            </select>
            <input
                className="status-bar-input"
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                placeholder="New preset name"
            />
            <button className="status-bar-button" onClick={saveFilterPreset}>Save current filters as preset</button>
            <button className="status-bar-button" onClick={resetFilters}>Reset Filters</button>
            {isLoggedIn && (
                <div className="delete-icon-wrapper" ref={deleteDropdownRef}>
                    <button className="status-bar-button" onClick={() => setShowDeleteDropdown(!showDeleteDropdown)}>▼</button>
                    {showDeleteDropdown && (
                        <div className="delete-dropdown">
                            <button onClick={() => setShowDeleteModal(true)}>Delete Preset</button>
                        </div>
                    )}
                </div>
            )}

            {showDeleteModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowDeleteModal(false)}>&times;</span>
                        <h2>Delete Preset</h2>
                        <select className="status-bar-select" onChange={e => setPresetToDelete(e.target.value)}>
                            <option>Select a filter preset</option>
                            {Object.keys(filterPresets).map(presetName => (
                                <option key={presetName} value={presetName}>{presetName}</option>
                            ))}
                        </select>
                        <p></p>
                        <button className="status-bar-button" onClick={handleDeletePreset}>Delete</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomStatusBar;

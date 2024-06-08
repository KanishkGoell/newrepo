import React, { useState, useEffect, useRef } from 'react';
import MyAgGrid from './MyAgGrid';
import CustomStatusBar from './CustomStatusBar';
import './Dashboard.css'; // Ensure your CSS file is imported
import './modal.css'; // Ensure your modal CSS file is imported

const Dashboard = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [filterPresets, setFilterPresets] = useState({});
    const [columnState, setColumnState] = useState([]);
    const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
    const logoutDropdownRef = useRef(null);

    useEffect(() => {
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            setCurrentUser(savedUser);
            setIsLoggedIn(true);
            getPreferences(savedUser);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (logoutDropdownRef.current && !logoutDropdownRef.current.contains(event.target)) {
                setShowLogoutDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [logoutDropdownRef]);

    const openLoginModal = () => {
        setShowLoginModal(true);
        setShowRegisterModal(false);
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
    };

    const openRegisterModal = () => {
        setShowRegisterModal(true);
        setShowLoginModal(false);
    };

    const closeRegisterModal = () => {
        setShowRegisterModal(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://aggrid-backend-bvhu5sref-kanishk-goels-projects.vercel.app/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                alert('Registration successful');
                closeRegisterModal();
            } else {
                const error = await response.text();
                alert(error);
            }
        } catch (error) {
            console.error('Error registering:', error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://aggrid-backend-bvhu5sref-kanishk-goels-projects.vercel.app/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                setIsLoggedIn(true);
                setCurrentUser(username);
                sessionStorage.setItem('currentUser', username);
                closeLoginModal();
                getPreferences(username); // Load preferences after login
                window.location.reload();
            } else {
                const error = await response.text();
                alert(error);
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        setShowLogoutDropdown(false);
        window.location.reload();
    };

    const savePreferences = async (filters) => {
        if (!currentUser) return;
        try {
            await fetch('https://aggrid-backend-bvhu5sref-kanishk-goels-projects.vercel.app/savePreferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser, filters }),
            });
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    };

    const getPreferences = async (username) => {
        if (!username) return;
        try {
            const response = await fetch('https://aggrid-backend-bvhu5sref-kanishk-goels-projects.vercel.app/getPreferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            if (response.ok) {
                const prefs = await response.json();
                setFilterPresets(prefs.filters || {});
                setColumnState(prefs.columns || []);
                // Apply preferences to your grid
                if (gridApi) {
                    gridApi.setFilterModel(prefs.filters);
                    gridApi.setColumnState(prefs.columns);
                }
            } else {
                console.error('Error retrieving preferences:', response.statusText);
            }
        } catch (error) {
            console.error('Error retrieving preferences:', error);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            getPreferences(currentUser);
        }
    }, [isLoggedIn]);

    return (
        <div>
            <header>
                <div className="header-top">
                    <div className="header-links">
                        <a href="#help">Knowledge and Self Help</a>
                        <a href="#services">Additional Services</a>
                    </div>
                </div>
                <div className="header-content">
                    <img src="./logo.png" alt="Company Logo" className="logo" /> {/* Ensure you have a logo image in your public folder */}
                    <nav>
                        <ul>
                            <li><a href="#home">Home</a></li>
                            <li><a href="#profile">Profile</a></li>
                            <li><a href="#requests">Requests</a></li>
                        </ul>
                    </nav>
                    {!isLoggedIn ? (
                        <button className="login-button" onClick={openLoginModal}>Login</button>
                    ) : (
                        <div className="welcome-dropdown" ref={logoutDropdownRef}>
                            <span onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}>Welcome, {currentUser}</span>
                            {showLogoutDropdown && (
                                <div className="logout-dropdown">
                                    <button onClick={handleLogout}>Logout</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>
            <main>
                <div className="dashboard">
                    <CustomStatusBar 
                        gridApi={gridApi} 
                        filterPresets={filterPresets} 
                        setFilterPresets={setFilterPresets} 
                        savePreferences={savePreferences} 
                        isLoggedIn={isLoggedIn}
                        columnState={columnState}
                        setColumnState={setColumnState}
                        className="dashboard-section" 
                    /> {/* Ensure this is styled accordingly */}
                    <MyAgGrid savePreferences={savePreferences} setGridApi={setGridApi} />
                </div>
            </main>
            <footer>
                <p>© 2024 Company, Inc.</p>
            </footer>

            {showLoginModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeLoginModal}>&times;</span>
                        <h2>Login</h2>
                        <form onSubmit={handleLogin}>
                            <label htmlFor="username">Username:</label>
                            <input type="text" id="username" name="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                            <label htmlFor="password">Password:</label>
                            <input type="password" id="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button type="submit">Login</button>
                        </form>
                        <p>
                            New user? <a href="#register" onClick={openRegisterModal}>Register here</a>
                        </p>
                    </div>
                </div>
            )}
            {showRegisterModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeRegisterModal}>&times;</span>
                        <h2>Register</h2>
                        <form onSubmit={handleRegister}>
                            <label htmlFor="reg-username">Username:</label>
                            <input type="text" id="reg-username" name="reg-username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                            <label htmlFor="reg-email">Email:</label>
                            <input type="email" id="reg-email" name="reg-email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                            <label htmlFor="reg-password">Password:</label>
                            <input type="password" id="reg-password" name="reg-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button type="submit">Register</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

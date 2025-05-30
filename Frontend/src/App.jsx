import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'; // Import Link
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Content from './layout/Content';

import SignUp from './pages/SignUp';
import DashboardPage from './pages/DashboardPage';
import Companies from './pages/Companies';
import MainCompany from './pages/companiesComponents/MainCompany';
import Students from './pages/Students';
import Reports from './pages/Reports';
import JobPosting from './pages/JobPosting';
import Communication from './pages/Communication'; 
import Results from './pages/Results'; 
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import './App.css';

import axios from "axios";
import AdminPanel from './pages/AdminPanel';

function App() {
    const [open, setOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState(''); 
    const [isAdmin, setIsAdmin] = useState(false);  

    const verifyToken = async (token) => {
        try {
            const response = await axios.post(
                "http://localhost:3000/verify-token", 
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.isValid) {
                return {userName: response.data.userName}; 
            } else {
                return null; 
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return null; 
        }

    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            verifyToken(token).then(userData => {
                if (userData) {
                    setIsAuthenticated(true);
                    setUserName(userData.userName); 
                } else {
                    localStorage.removeItem('token'); 
                    setIsAuthenticated(false);
                    setUserName('');
                }
            });
        }
    }, []);

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleLogin = (userData) => {
        setIsAuthenticated(true);
        setUserName(userData.userName);
        setIsAdmin(userData.userName === 'admin'); 
    };

    const handleLogout = () => {
        localStorage.removeItem('token'); 
        setIsAuthenticated(false);
        setUserName(''); 
        setIsAdmin(false);
    };

    const ProtectedRoute = ({ children }) => {
        if (!isAuthenticated) {
            return <Navigate to="/auth" replace />;
        }
        return children;
    };


    return (
        <Router>
            <div className="app-container">
                {isAuthenticated && (
                    <>
                        <div className='header-container'>
                            <Header handleDrawerToggle={handleDrawerToggle} onLogout={handleLogout} userName={userName} isLoggedIn={isAuthenticated} /> {/* Pass userName prop */}
                        </div>
                        <div className='sidebar-container'>
                            <Sidebar open={open} />
                        </div>
                    </>
                )}
                <div className='Content-container'>
                    {isAuthenticated ? (
                        <Content open={open}>
                            <Routes>
                                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                                <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />

                                <Route path="/companies/:companyId/MainCompany" element={<ProtectedRoute><MainCompany /></ProtectedRoute>} />

                                <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                                <Route path="/job-posting" element={<JobPosting />} />
                                <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} /> {/* Add Communication route */}
                                <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} /> {/* Add Results route */}
                                <Route path="/admin" element={<AdminPanel />} /> {/* No protection anymore */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Content>
                    ) : (
                        <Routes>
                            <Route path="/auth" element={<SignUp onLogin={handleLogin} />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/verify-otp" element={<VerifyOTP />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                             {/* Add link to admin panel */}
                              <Route path="/admin" element={<AdminPanel />} /> {/* No protection anymore */}
                            <Route path="*" element={<Navigate to="/auth" replace />} />
                        </Routes>
                    )}
                </div>
            </div>
        </Router>
    );
}

export default App;
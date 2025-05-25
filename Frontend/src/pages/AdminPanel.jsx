import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import adminStyles from './AdminPanel.module.css'; 

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [adminToken, setAdminToken] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: ''
    });
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);  
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setAdminToken(token);
            setIsAdminLoggedIn(true);
            fetchAllUsers(token);
        }
    }, []);

    const fetchAllUsers = async (token) => {
        try {
            const response = await axios.get("http://localhost:3000/admin/all-users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            localStorage.removeItem('adminToken');
            setAdminToken('');
            setIsAdminLoggedIn(false);
        }
    };

    const handleAdminLogin = async () => {
        try {
            const response = await axios.post("http://localhost:3000/admin/super-admin-login", loginForm);
            if (response.status === 200) {
                localStorage.setItem('adminToken', response.data.token);
                setAdminToken(response.data.token);
                setLoginError('');
                setIsAdminLoggedIn(true);
                fetchAllUsers(response.data.token); 
            } else {
                setLoginError('Invalid credentials'); 
            }
        } catch (error) {
            setLoginError('Invalid credentials');
            console.error('Admin login failed:', error);
        }
    };

    const handleAuthorizationChange = async (id, is_authorized) => {
        try {
            await axios.put(`http://localhost:3000/admin/update-authorization/${id}`, { is_authorized }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            setUsers(users.map(user =>
                user.admin_id === id ? { ...user, is_authorized } : user
            ));
        } catch (error) {
            console.error('Error updating authorization:', error);
        }
    };

    const handleInputChange = (e) => {
        setLoginForm({
            ...loginForm,
            [e.target.name]: e.target.value
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setAdminToken('');
        setIsAdminLoggedIn(false);
        navigate('/');
    };

    const renderLoginForm = () => (
        <div className={adminStyles.admin_login_container}>
            <h2>Admin Login</h2>
            {loginError && <p className={adminStyles.error_message}>{loginError}</p>}
            <div className={adminStyles.input_group}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={handleInputChange}
                />
            </div>
            <div className={adminStyles.input_group}>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={handleInputChange}
                />
            </div>
            <button className={adminStyles.login_button} onClick={handleAdminLogin}>Login</button>
        </div>
    );

    const renderUserTable = () => (
        <div className={adminStyles.admin_panel_container}>
            <div className={adminStyles.header}>
                <h2>Admin Panel</h2>
                <button className={adminStyles.logout_button} onClick={handleLogout}>Exit</button>
            </div>
            <table className={adminStyles.user_table}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Authorized</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.admin_id}>
                            <td>{user.admin_name}</td>
                            <td>{user.email}</td>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={user.is_authorized}
                                    onChange={(e) => handleAuthorizationChange(user.admin_id, e.target.checked)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className={adminStyles.outer_container}>
            {isAdminLoggedIn ? renderUserTable() : renderLoginForm()}
        </div>
    );
};

export default AdminPanel;
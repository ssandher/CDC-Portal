import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './SignUp.module.css';
import pdeuLogo from '../photos/Pdeu_logo.png';
import pdeuBuild from '../photos/pdpu_build.jpg';
import axios from 'axios';

const SignUp = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(true);
    const [formData, setFormData] = useState({
        admin_name: '',  // Added admin_name
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isSignUp ? 'http://localhost:3000/signup' : 'http://localhost:3000/login'; 

            const response = await axios.post(url, formData);

            const data = response.data; 
            if (response.status === 200) {
                if (isSignUp) {
                    alert('Registration successful! Your account will be authorized by an administrator.');
                    navigate('/auth');
                } else {
                    localStorage.setItem('token', data.token);
                    onLogin({ userName: data.userName});  // ***Change: data.userName  ***
                    navigate('/');
                }
            } else {
                throw new Error(data.message || 'Something went wrong'); 
            }
        } catch (error) {
            alert(error.message); 
        }
    };

    return (
        <div className={styles.signupContainer}>
            <div className={styles.formSection}>
                <div className={styles.logoContainer}>
                    <img src={pdeuLogo} alt="PDEU Logo" className={styles.pdeuLogo} />
                </div>
                <h2 className={styles.signupText}>{isSignUp ? 'SIGN-UP' : 'LOGIN'}</h2>

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <div className={styles.formGroup}>
                            <input type="text" name="admin_name" value={formData.admin_name} onChange={handleChange} placeholder="Enter Your Name" required className={styles.inputField} />
                        </div>
                    )}
                    <div className={styles.formGroup}>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter Email ID" required className={styles.inputField} />
                    </div>
                    <div className={styles.formGroup}>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter Password" required className={styles.inputField} />
                        {!isSignUp && (
                            <Link to="/forgot-password" className={styles.forgotPassword}>Forgot Password?</Link>
                        )}
                    </div>

                    <button type="submit" className={styles.submitBtn}>{isSignUp ? 'SIGN UP' : 'LOGIN'}</button>
                    {error && <p className={styles.error}>{error}</p>}

                </form>

                <p className={styles.toggleText}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => setIsSignUp(!isSignUp)} className={styles.toggleBtn}>
                        {isSignUp ? 'Login' : 'Sign Up'}
                    </button>
                </p>
            </div>
            <div className={styles.imageSection}>
                <div className={styles.imageOverlay}></div>
                <img src={pdeuBuild} alt="PDEU Building" className={styles.pdeuBuilding} />
            </div>
        </div>
    );
};

export default SignUp;
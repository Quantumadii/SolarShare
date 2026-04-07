import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (jwtToken) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('token');
                setToken(null);
            }
        } catch (err) {
            console.warn("Could not fetch user profile:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
            setIsAuthenticated(true);
            fetchUserProfile(storedToken);
        } else {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
        }
    }, []);

    const login = (jwtToken) => {
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);
        setIsAuthenticated(true);
        fetchUserProfile(jwtToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        toast.success("Logout Successful");
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, login, logout, user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

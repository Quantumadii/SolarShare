import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom' 

const Logout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate(); 
    const handleLogout = () => {
        navigate('/');
        logout();             
    };
    return (
        <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
            Logout
        </button>
    )
}

export default Logout
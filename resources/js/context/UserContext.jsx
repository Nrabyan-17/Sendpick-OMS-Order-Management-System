import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Try to get user from localStorage first (saved during login)
                const savedUser = localStorage.getItem('user');

                if (savedUser) {
                    const userData = JSON.parse(savedUser);

                    // Debug: Log raw user data untuk troubleshooting
                    console.log('[UserContext] Raw userData from localStorage:', userData);
                    console.log('[UserContext] Roles data:', userData.roles);
                    console.log('[UserContext] First role:', userData.roles?.[0]);

                    // Transform to match expected format
                    setUser({
                        fullName: userData.name || 'User',
                        username: userData.email || '',
                        phone: userData.phone || '',
                        role: userData.roles?.[0] || 'Admin',
                        branch: 'SendPick Logistics',
                        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=6366f1&color=fff`,
                        userId: userData.user_id,
                    });
                } else {
                    // If no localStorage, try to fetch from API
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                        const response = await axios.get('/auth/me');
                        if (response.data?.success) {
                            const apiUser = response.data.data.user;
                            const transformedUser = {
                                fullName: apiUser.name || 'User',
                                username: apiUser.email || '',
                                phone: apiUser.phone || '',
                                role: apiUser.roles?.[0] || 'Admin',
                                branch: 'SendPick Logistics',
                                photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(apiUser.name || 'User')}&background=6366f1&color=fff`,
                                userId: apiUser.user_id,
                            };

                            setUser(transformedUser);
                            // Save to localStorage for next time
                            localStorage.setItem('user', JSON.stringify(apiUser));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load user data:', error);
                // If all fails, set default fallback
                setUser({
                    fullName: 'User',
                    username: 'user@sendpick.com',
                    phone: '',
                    role: 'Admin',
                    branch: 'SendPick Logistics',
                    photo: 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff',
                });
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, []);

    const updateUser = (newData) => {
        setUser((prev) => ({
            ...prev,
            ...newData,
        }));

        // Update localStorage as well
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            localStorage.setItem('user', JSON.stringify({
                ...userData,
                ...newData,
            }));
        }
    };

    if (loading) {
        return null; // Or a loading spinner
    }

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            {children}
        </UserContext.Provider>
    );
};
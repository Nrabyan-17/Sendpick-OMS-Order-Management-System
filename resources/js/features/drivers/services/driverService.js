import api from '../../../utils/api';

/**
 * 
 * @param {Object} params - { page, per_page, search, status, etc. }
 */
export async function fetchDrivers(params = {}) {

    try {
        // memanggil API Laravel
        const response = await api.get('/drivers', { params });

        console.log('Response dari API laravel:', response.data);

        return {
            // Kesalahannya dibagian sini
            items: response.data?.data || [],
            pagination: response.data?.data?.pagination || {}
        };

    } catch (error) {
        console.error('Error fetching drivers:', error);
        throw error;
    }
}

export async function getDriver(driverId) {

    try {
        const response = await api.get(`/drivers/${driverId}`);
        return response.data?.data || null;
    } catch (error) {
        console.error(`Error getting driver ${driverId}:`, error);
        throw error;
    }
}

export async function createDriver(driverData) {

    try {
        const response = await api.post('/drivers', driverData);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message
        };
    } catch (error) {
        console.error('Error creating driver:', error.response?.data?.errors)
        throw error;
    }
}

export async function updateDriver(driverId, driverData) {
    try {
        const response = await api.put(`/drivers/${driverId}`, driverData);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message
        };
    } catch (error) {
        console.error(`❌ Update driver ${driverId} failed:`, error.response?.data?.errors);
        throw error;
    }
}

export async function deleteDriver(driverId) {
    try {
        const response = await api.delete(`/drivers/${driverId}`);
        return { success: true, message: response.data?.message };
    } catch (error) {
        console.error(`❌ Delete driver ${driverId} failed:`, error);
        throw error;
    }
}

export async function getAvailableDrivers(params = {}) {
    try {
        const response = await api.get('/drivers/available', { params });
        return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
        console.error('Error fetching available drivers:', error);
        throw error;
    }

}
// config.js - Store all API endpoints
const API = {
    baseUrl: window.location.origin,
    
    // Auth endpoints
    login: window.location.origin + "/login",
    register: window.location.origin + "/register",
    logout: window.location.origin + "/logout",
    checkSession: window.location.origin + "/check-session",
    
    // Medicine endpoints
    medicines: window.location.origin + "/medicines",
    medicine: (id) => window.location.origin + `/medicine/${id}`,
    addMedicine: window.location.origin + "/addMedicine",
    deleteMedicine: (id) => window.location.origin + `/deleteMedicine/${id}`,
    
    // Order endpoints
    order: window.location.origin + "/order",
    myOrders: window.location.origin + "/my-orders",
    updateOrderStatus: (id) => window.location.origin + `/order/${id}/status`,
    
    // Admin endpoints
    adminData: window.location.origin + "/adminData"
};

// Helper function for API calls
async function apiCall(endpoint, method = "GET", data = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include" // Important for sessions
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(endpoint, options);
        return await response.json();
    } catch (error) {
        console.error("API Call Error:", error);
        throw error;
    }
}

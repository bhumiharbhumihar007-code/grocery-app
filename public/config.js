// API Configuration - Works on both local and Render
const API = {
    baseUrl: window.location.origin,
    
    // Auth endpoints
    login: window.location.origin + "/login",
    register: window.location.origin + "/register",
    logout: window.location.origin + "/logout",
    checkSession: window.location.origin + "/check-session",
    
    // Medicine endpoints
    medicines: window.location.origin + "/medicines",
    addMedicine: window.location.origin + "/addMedicine",
    deleteMedicine: (id) => window.location.origin + `/deleteMedicine/${id}`,
    
    // Order endpoints
    order: window.location.origin + "/order",
    updateOrderStatus: (id) => window.location.origin + `/order/${id}/status`,
    
    // Admin endpoints
    adminData: window.location.origin + "/adminData"
};

// Helper function for API calls
async function apiCall(endpoint, method = "GET", data = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(endpoint, options);
    return await response.json();
}

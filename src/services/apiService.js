// src/services/apiService.js
import axios from "axios";

// Define your API base URL
const API_BASE_URL = "https://app.evnzon.in";

// -------------------- AUTH FUNCTIONS --------------------
export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

const authHeader = () => {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const storeAuthToken = (token) => {
  localStorage.setItem("authToken", token);
};

export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
};

// -------------------- BUSINESS PARTNER APIS --------------------
export const getAllBusinessPartners = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/business-partner/all`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all business partners:", error);
    throw error;
  }
};

export const getBusinessDetailsById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/business-partner/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching business details:", error);
    throw error;
  }
};

export const updateBusinessDetailsAPI = async (id, data) => {
  try {
    // Ensure id is inside body
    const payload = { ...data, id: Number(id) };
    const response = await axios.put(`${API_BASE_URL}/business-partner`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating business details:", error);
    throw error;
  }
};
// export const updateBusinessDetailsAPI = async (id, data) => {
//   try {
//     const response = await axios.put(`${API_BASE_URL}/business-partner/${id}`, data, {
//       headers: authHeader(),
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error updating business details:", error);
//     throw error;
//   }
// };

export const getBusinessPartnerCount = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/business-partner/count`, {
      headers: authHeader(),
    });
    if (typeof response.data === "number") return response.data;
    if (response.data?.count) return response.data.count;
    return 0;
  } catch (error) {
    console.error("Error fetching business partner count:", error);
    throw error;
  }
};

export const deleteBusinessPartner = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/business-partner/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting business partner ${id}:`, error);
    throw error;
  }
};

// -------------------- USER APIS --------------------
export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/all`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

export const getUserCount = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/count`, {
      headers: authHeader(),
    });
    if (typeof response.data === "number") return response.data;
    if (response.data?.count) return response.data.count;
    return 0;
  } catch (error) {
    console.error("Error fetching user count:", error);
    throw error;
  }
};

// -------------------- PROMOTION APIS --------------------
export const getAllPromotions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/promotions/all`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching promotions:", error);
    throw error;
  }
};

export const addPromotion = async (promotionData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/promotions/add`, promotionData, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error adding promotion:", error);
    throw error;
  }
};

export const deletePromotionById = async (promotionId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/promotions/delete/${promotionId}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting promotion:", error);
    throw error;
  }
};

// -------------------- IMAGE APIS --------------------
export const uploadBusinessImage = async (imageFile, businessPartnerId) => {
  const formData = new FormData();
  formData.append("images", imageFile);
  formData.append("businessPartnerId", String(businessPartnerId));

  try {
    const response = await axios.post(`${API_BASE_URL}/s3-image`, formData, {
      headers: {
        ...authHeader(),
      },
    });
    const apiResponseData = response.data;
    if (apiResponseData?.id && apiResponseData?.url) {
      return { id: apiResponseData.id, url: apiResponseData.url };
    }
    return null;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const deleteBusinessImage = async (imageId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/s3-image/${imageId}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

// -------------------- PAYMENT APIS --------------------
export const getAllPayments = async () => {
  try {
    console.log(`Fetching all payments from ${API_BASE_URL}/payment/all`);
    const response = await axios.get(`${API_BASE_URL}/payment/all`, {
      headers: authHeader(),
    });
    console.log("Payment API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all payments:", error.response?.data || error.message);
    throw error;
  }
};

export const getPaymentById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/payment/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching payment ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deletePaymentById = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/payment/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting payment ${id}:`, error.response?.data || error.message);
    throw error;
  }
};


// -------------------- OFFERS APIS --------------------
export const getAllOffers = async () => {
  try {
    console.log(`Fetching all offers from ${API_BASE_URL}/offers`);
    const response = await axios.get(`${API_BASE_URL}/offers`, {
      headers: authHeader(),
    });
    console.log("Offers API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all offers:", error.response?.data || error.message);
    throw error;
  }
};

export const createOffer = async (formData) => {
  try {
    console.log("Creating offer with data:", formData);
    const response = await axios.post(`${API_BASE_URL}/offers`, formData, {
      headers: {
        ...authHeader(),
        // Don't set Content-Type for FormData, axios will set it automatically
      },
    });
    console.log("Offer created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating offer:", error.response?.data || error.message);
    throw error;
  }
};

export const updateOffer = async (offerId, formData) => {
  try {
    console.log(`Updating offer ${offerId} with data:`, formData);
    const response = await axios.put(`${API_BASE_URL}/offers/${offerId}`, formData, {
      headers: {
        ...authHeader(),
      },
    });
    console.log(`Offer ${offerId} updated successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating offer ${offerId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteOffer = async (offerId) => {
  try {
    console.log(`Attempting to delete offer with ID: ${offerId}`);
    const response = await axios.delete(`${API_BASE_URL}/offers/${offerId}`, {
      headers: authHeader(),
    });
    console.log(`Offer ${offerId} deleted successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error deleting offer ${offerId}:`, error.response?.data || error.message);
    throw error;
  }
};





// // c:\Users\kd1812\Desktop\admin-dashboard-Envezon\src\services\apiService.js
// import axios from 'axios';

// // Define your API base URL
// // Using an environment variable is best practice for different environments (dev, staging, prod)
// // Example: const API_BASE_URL = process.env.REACT_APP_API_URL || "https://codizone.in";
// const API_BASE_URL = "https://app.evnzon.in";

// // Function to get authentication token
// // Adjust this if you store your token differently (e.g., sessionStorage, context, Redux)
// export const getAuthToken = () => {
//   // console.log("Getting auth token from localStorage");
//   return localStorage.getItem("authToken"); // Changed from 'adminToken' to 'authToken' to match usage elsewhere in your file
// };

// // Helper to create authorization headers
// const authHeader = () => {
//   const token = getAuthToken();
//   if (token) {
//     return { Authorization: `Bearer ${token}` }; // Adjust if your auth scheme is different
//   }
//   return {};
// };

// // Function to store authentication token
// export const storeAuthToken = (token) => {
//   console.log("Storing auth token in localStorage:", token);
//   localStorage.setItem("authToken", token);
// };

// // Function to clear authentication token
// export const clearAuthToken = () => {
//   console.log("Clearing auth token from localStorage");
//   localStorage.removeItem("authToken");
// };


// // --- Business Partner Endpoints ---

// /**
//  * Fetches all business partners.
//  */
// export const getAllBusinessPartners = async () => {
//   try {
//     console.log(`Fetching all business partners from ${API_BASE_URL}/business-partner/all`);
//     const response = await axios.get(`${API_BASE_URL}/business-partner/all`, {
//       headers: authHeader(),
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching all business partners:", error.response?.data || error.message);
//     throw error;
//   }
// };

// /**
//  * Fetches details for a specific business by ID.
//  * @param {string|number} id - The ID of the business.
//  */
// export const getBusinessDetailsById = async (id) => {
//   // VERIFY THIS PATH: Common patterns are /business-partner/{id} or /business-partners/{id}
//   const endpointPath = `/business-partner/`; // Assuming ID is part of the path
//   try {
//     console.log(`Fetching business details for ID ${id} from ${API_BASE_URL}${endpointPath}`);
//     const response = await axios.get(`${API_BASE_URL}${endpointPath}`, {
//       headers: authHeader(),
//     });
//     return response.data;
//   } catch (error) {
//     console.error(`Error fetching business details for ID ${id}:`, error.response?.data || error.message);
//     throw error;
//   }
// };

// /**
//  * Updates details for a specific business.
//  * @param {string|number} id - The ID of the business to update.
//  * @param {object} data - The data to update.
//  */
// export const updateBusinessDetailsAPI = async (id, data) => {
//   // VERIFY THIS PATH: Common patterns are /business-partner/{id} or /business-partners/{id}
//   const endpointPath = `/business-partner/`; // Assuming ID is part of the path for PUT/PATCH
//   try {
//     console.log(`Attempting to update business details for ID ${id} at ${API_BASE_URL}${endpointPath}`);
//     const response = await axios.put(`${API_BASE_URL}${endpointPath}`, data, { // Or axios.patch
//       headers: authHeader(),
//     });
//     return response.data;
//   } catch (error) {
//     console.error(`Error updating business details for ID ${id}:`, error.response?.data || error.message);
//     throw error;
//   }
// };

// /**
//  * Gets the count of business partners.
//  */
// export const getBusinessPartnerCount = async () => {
//   try {
//     console.log(`Fetching business partner count from ${API_BASE_URL}/business-partner/count`);
//     const response = await axios.get(`${API_BASE_URL}/business-partner/count`, {
//       headers: authHeader(),
//     });
//     // console.log("API Response for /business-partner/count:", response.data);
//     // Adjust based on how your API returns the count
//     if (typeof response.data === "number") {
//       return response.data;
//     } else if (response.data && typeof response.data.count === "number") {
//       return response.data.count;
//     }
//     console.warn("getBusinessPartnerCount received unexpected data format, defaulting to 0. Response:", response.data);
//     return 0;
//   } catch (error) {
//     console.error("Error fetching business partner count:", error.response?.data || error.message);
//     throw error; // Or return 0 after logging
//   }
// };


// // --- User Endpoints ---

// /**
//  * Fetches all users.
//  */
// export const getAllUsers = async () => {
//   try {
//     console.log(`Fetching all users from ${API_BASE_URL}/user/all`);
//     const response = await axios.get(`${API_BASE_URL}/user/all`, {
//       headers: authHeader(),
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching all users:", error.response?.data || error.message);
//     throw error;
//   }
// };

// /**
//  * Gets the count of users.
//  */
// export const getUserCount = async () => {
//   try {
//     console.log(`Fetching user count from ${API_BASE_URL}/user/count`);
//     const response = await axios.get(`${API_BASE_URL}/user/count`, {
//       headers: authHeader(),
//     });
//     // console.log("API Response for /user/count:", response.data);
//     // Adjust based on how your API returns the count
//     if (typeof response.data === "number") {
//       return response.data;
//     } else if (response.data && typeof response.data.count === "number") {
//       return response.data.count;
//     }
//     console.warn("getUserCount received unexpected data format, defaulting to 0. Response:", response.data);
//     return 0;
//   } catch (error) {
//     console.error("Error fetching user count:", error.response?.data || error.message);
//     throw error; // Or return 0 after logging
//   }
// };


// // --- Promotion Endpoints ---

// /**
//  * Fetches all promotions.
//  */
// export const getAllPromotions = async () => {
//   try {
//     console.log(`Fetching all promotions from ${API_BASE_URL}/promotions/all`);
//     const response = await axios.get(`${API_BASE_URL}/promotions/all`, {
//       headers: authHeader(),
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching all promotions:", error.response?.data || error.message);
//     throw error;
//   }
// };

// /**
//  * Adds a new promotion.
//  * @param {object} promotionData - The data for the new promotion.
//  */
// export const addPromotion = async (promotionData) => {
//   try {
//     console.log(`Adding new promotion to ${API_BASE_URL}/promotions/add`);
//     const response = await axios.post(`${API_BASE_URL}/promotions/add`, promotionData, {
//       headers: authHeader(),
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error adding promotion:", error.response?.data || error.message);
//     throw error;
//   }
// };

// /**
//  * Deletes a promotion by ID.
//  * @param {string|number} promotionId - The ID of the promotion to delete.
//  */
// export const deletePromotionById = async (promotionId) => {
//   try {
//     console.log(`Deleting promotion ID ${promotionId} from ${API_BASE_URL}/promotions/delete/${promotionId}`);
//     const response = await axios.delete(`${API_BASE_URL}/promotions/delete/${promotionId}`, {
//       headers: authHeader(),
//     });
//     return response.data; // Or handle 204 No Content if API returns that
//   } catch (error) {
//     console.error(`Error deleting promotion ID ${promotionId}:`, error.response?.data || error.message);
//     throw error;
//   }
// };


// // --- Image Endpoints ---

// // /**
// //  * Uploads an image for a business.
// //  * @param {File} imageFile - The image file to upload.
// //  * @param {string|number} businessPartnerId - The ID of the business partner.
// //  */
// // export const uploadBusinessImage = async (imageFile, businessPartnerId) => {
// //   const formData = new FormData();
// //   formData.append('images', imageFile);
// //   formData.append('businessPartnerId', String(businessPartnerId));

// //   try {
// //     console.log(`Uploading image for business ID ${businessPartnerId} to ${API_BASE_URL}/s3-image`);
// //     const response = await axios.post(`${API_BASE_URL}/s3-image`, formData, {
// //       headers: {
// //         ...authHeader(), // Spread auth headers
// //         // 'Content-Type': 'multipart/form-data' // Axios sets this for FormData
// //       },
// //     });
// //     // Adjust based on your API's response structure for successful upload
// //     return response.data.data || response.data;
// //   } catch (error) {
// //     console.error('Error uploading image:', error.response?.data || error.message);
// //     throw error;
// //   }
// // };


// export const uploadBusinessImage = async (imageFile, businessPartnerId) => {
//   const formData = new FormData();
//   formData.append('images', imageFile); // Key 'images' as per your curl example
//   formData.append('businessPartnerId', String(businessPartnerId));

//   try {
//     console.log(`API Service: Uploading image for business ID ${businessPartnerId} to ${API_BASE_URL}/s3-image`);
//     const response = await axios.post(`${API_BASE_URL}/s3-image`, formData, {
//       headers: {
//         ...authHeader(), // Spread auth headers to include Authorization
//         // 'Content-Type': 'multipart/form-data' // Axios usually sets this automatically for FormData
//       },
//     });

//     // CRITICAL: Log the actual raw response from your backend
//     console.log('API Service: Raw response from /s3-image upload:', JSON.stringify(response.data, null, 2));

//     // --- ADJUST THE PARSING LOGIC BELOW BASED ON YOUR ACTUAL BACKEND RESPONSE ---
//     // The goal is to return an object like: { id: "uniqueImageId", url: "imageUrl" }

//     const apiResponseData = response.data;

//     // Example 1: If backend returns { id: "...", url: "..." } directly
//     if (apiResponseData && apiResponseData.id && apiResponseData.url) {
//       console.log("API Service: Parsed as direct id/url object.");
//       return { id: apiResponseData.id, url: apiResponseData.url };
//     }

//     // If none of the above structures match, the format is unexpected.
//     console.error("API Service: Could not parse expected id and url from /s3-image response. Response was:", apiResponseData);
//     return null; // Or throw new Error('API returned unexpected format for image upload.');

//   } catch (error) {
//     console.error('API Service: Error uploading image:', error.response?.data || error.message || error);
//     // Re-throw the error so the component can catch it and display a message
//     throw error;
//   }
// };


// /**
//  * Deletes an image by ID.
//  * @param {string|number} imageId - The ID of the image to delete.
//  */
// export const deleteBusinessImage = async (imageId) => {
//   try {
//     console.log(`Deleting image ID ${imageId} from ${API_BASE_URL}/s3-image/${imageId}`);
//     const response = await axios.delete(`${API_BASE_URL}/s3-image/${imageId}`, {
//       headers: authHeader(),
//     });
//     return response.data; // Or handle 204 No Content
//   } catch (error) {
//     console.error(`Error deleting image ID ${imageId}:`, error.response?.data || error.message);
//     throw error;
//   }
// };


// // // c:\Users\kd1812\Desktop\admin-dashboard-Envezon\src\services\apiService.js
// // import axios from 'axios';
// // // This would be your actual base URL for the API
// // const API_BASE_URL = "https://codizone.in";

// // // A generic fetch wrapper (optional, but good practice)
// // const apiFetch = async (endpoint, options = {}, method = null) => {
// //   const { body, ...customConfig } = options;
// //   const headers = { "Content-Type": "application/json" };

// //   // Retrieve token for authenticated requests
// //   const token = getAuthToken(); // Assuming getAuthToken is defined in this file
// //   if (token) {
// //     headers["Authorization"] = `Bearer ${token}`; // Adjust if your auth scheme is different
// //   }

// //   const config = {
// //     method: method ? method : body ? customConfig.method || "POST" : "GET",
// //     ...customConfig, // Spread the rest of the options, excluding body
// //     headers: {
// //       ...headers,
// //       ...customConfig.headers,
// //     },
// //   };

// //   if (body && typeof body === "object") {
// //     // Ensure body is stringified if it's an object
// //     config.body = JSON.stringify(body);
// //   } else if (body) {
// //     config.body = body;
// //   }

// //   try {
// //     const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
// //     if (!response.ok) {
// //       const errorData = await response
// //         .json()
// //         .catch(() => ({ message: response.statusText }));
// //       const error = new Error(
// //         errorData.message || `API Error: ${response.status} - ${response.url}`
// //       );
// //       error.response = response;
// //       error.data = errorData;
// //       throw error;
// //     }
// //     if (response.status === 204) {
// //       // Handle No Content response
// //       return null;
// //     }
// //     return await response.json();
// //   } catch (error) {
// //     console.error(
// //       `API Fetch Error (${config.method} ${API_BASE_URL}${endpoint}):`,
// //       error.data || error.message
// //     );
// //     throw error; // Re-throw to be caught by the component
// //   }
// // };

// // export const getBusinessDetailsById = async (id) => {
// //   // Ensure this path is correct. Examples:
// //   // '/business-partner/${id}'
// //   // '/api/business-partner/${id}'
// //   // '/business-partners/${id}' (plural)
// //   const endpointPath = `/business-partner/all`; // <--- VERIFY THIS PATH WITH POSTMAN
// //   const fullUrl = `${API_BASE_URL}${endpointPath}`;

// //   console.log(
// //     "Attempting to fetch business details from (apiService.js):",
// //     fullUrl
// //   );

// //   const token = localStorage.getItem("authToken"); // Or however you get your token
// //   const headers = {
// //     "Content-Type": "application/json",
// //   };
// //   if (token) {
// //     headers["Authorization"] = `Bearer ${token}`;
// //   }

// //   const response = await fetch(fullUrl, { headers });
// //   if (!response.ok) {
// //     const errorData = await response.json().catch(() => ({
// //       message: `HTTP error! status: ${response.status} at ${response.url}`,
// //     }));
// //     throw new Error(
// //       errorData.message || `API Error: ${response.status} - ${response.url}`
// //     );
// //   }
// //   return response.json();
// // };

// // export const updateBusinessDetailsAPI = async (id, data) => {
// //   // Ensure this path is correct for updates.
// //   const endpointPath = `/business-partner/`; // <--- VERIFY THIS PATH WITH POSTMAN
// //   const fullUrl = `${API_BASE_URL}${endpointPath}`;
// //   console.log(
// //     "Attempting to update business details at (apiService.js):",
// //     fullUrl
// //   );

// //   const token = localStorage.getItem("authToken");
// //   const headers = {
// //     "Content-Type": "application/json",
// //   };
// //   if (token) {
// //     headers["Authorization"] = `Bearer ${token}`;
// //   }

// //   const response = await fetch(fullUrl, {
// //     method: "PUT", // Or 'POST' or 'PATCH' depending on your API
// //     headers: headers,
// //     body: JSON.stringify(data),
// //   });

// //   if (!response.ok) {
// //     const errorData = await response.json().catch(() => ({
// //       message: `HTTP error! status: ${response.status} at ${response.url}`,
// //     }));
// //     throw new Error(
// //       errorData.message ||
// //         `Failed to update business details: ${response.status}`
// //     );
// //   }
// //   return response.json();
// // };

// // // Function to get all users
// // export const getAllUsers = async () => {
// //   console.log("Fetching all users from /user/all");
// //   return await apiFetch("/user/all"); // GET request
// // };

// // // Function for Dashboard: Get User Count
// // export const getUserCount = async () => {
// //   const responseData = await apiFetch("/user/count");
// //   console.log(
// //     "API Response for /user/count (from getUserCount):",
// //     responseData
// //   );
// //   // Check if responseData itself is the count, or if it's an object containing count
// //   if (typeof responseData === "number") {
// //     return responseData;
// //   } else if (responseData && typeof responseData.count === "number") {
// //     return responseData.count;
// //   }
// //   console.warn(
// //     "getUserCount received unexpected data format or error, defaulting to 0. Response:",
// //     responseData
// //   );
// //   return 0; // Fallback value
// // };

// // // Function for Dashboard: Get Business Partner Count
// // // Function for Dashboard: Get Business Partner Count
// // export const getBusinessPartnerCount = async () => {
// //   const responseData = await apiFetch("/business-partner/count");
// //   console.log(
// //     "API Response for /business-partner/count (from getBusinessPartnerCount):",
// //     responseData
// //   );
// //   // Check if responseData itself is the count, or if it's an object containing count
// //   if (typeof responseData === "number") {
// //     return responseData; // This will now correctly return 15 if responseData is 15
// //   } else if (responseData && typeof responseData.count === "number") {
// //     return responseData.count;
// //   }
// //   console.warn(
// //     "getBusinessPartnerCount received unexpected data format or error, defaulting to 0. Response:",
// //     responseData
// //   );
// //   return 0; // Fallback value
// // };
// // // Function to clear authentication token (example implementation)
// // export const clearAuthToken = () => {
// //   console.log("Clearing auth token from localStorage");
// //   // In a real application, you would clear the token from localStorage or sessionStorage
// //   localStorage.removeItem("authToken");
// // };

// // // Function to store authentication token (example implementation)
// // export const storeAuthToken = (token) => {
// //   console.log("Storing auth token in localStorage:", token);
// //   // In a real application, you would store the token in localStorage or sessionStorage
// //   localStorage.setItem("authToken", token);
// // };

// // // Function to get all business partners
// // export const getAllBusinessPartners = async () => {
// //   return await apiFetch("/business-partner/all"); // GET request
// // };

// // // Function to get authentication token (example implementation)
// // export const getAuthToken = () => {
// //   console.log("Getting auth token from localStorage");
// //   // In a real application, you would retrieve the token from localStorage or sessionStorage
// //   return localStorage.getItem("authToken");
// //   // return "simulated_auth_token_12345"; // Example token if not using localStorage yet
// // };
// // // Function to get all promotions
// // export const getAllPromotions = async () => {
// //   console.log("Fetching all promotions from /promotions/all");
// //   return await apiFetch("/promotions/all"); // GET request
// // };

// // // Function to add a new promotion
// // export const addPromotion = async (promotionData) => {
// //   console.log("Adding new promotion to /promotions/add");
// //   return await apiFetch("/promotions/add", {
// //     method: "POST",
// //     body: promotionData,
// //   });
// // };

// // export const deletePromotionById = async (promotionId) => {
// //   const response = await apiFetch(
// //     `/promotions/delete/${promotionId}`,
// //     {},
// //     "DELETE"
// //   );
// //   return response;
// // };

// // export const uploadBusinessImage = async (imageFile, businessPartnerId) => {
// //   const formData = new FormData();
// //   formData.append('images', imageFile); // Key 'images' as per your curl example
// //   formData.append('businessPartnerId', String(businessPartnerId)); // Key 'businessPartnerId'

// //   try {
// //     const response = await axios.post(`${API_BASE_URL}/s3-image`, formData, {
// //       headers: {
// //         ...authHeader(),
// //         // 'Content-Type': 'multipart/form-data' is usually set automatically by axios for FormData
// //       },
// //     });
// //     // Assuming the response.data is the new image object { id, url, ... }
// //     // or { data: { id, url, ... } } or an array [ { id, url, ... } ]
// //     // Adjust based on your actual API response structure.
// //     // For this example, let's assume response.data is the image object.
// //     if (response.data && response.data.data) { // Example: if response is { message: '...', data: { id: '...', url: '...'}}
// //         return response.data.data;
// //     }
// //     return response.data; // Example: if response is { id: '...', url: '...'}
// //   } catch (error) {
// //     console.error('Error uploading image in API service:', error.response || error);
// //     throw error;
// //   }
// // };


// // export const deleteBusinessImage = async (imageId) => {
// //   try {
// //     const response = await axios.delete(`${API_BASE_URL}/s3-image/${imageId}`, {
// //       headers: authHeader(),
// //     });
// //     return response.data; // Or handle based on status code (e.g., return true on 204)
// //   } catch (error) {
// //     console.error('Error deleting image in API service:', error.response || error);
// //     throw error;
// //   }
// // };

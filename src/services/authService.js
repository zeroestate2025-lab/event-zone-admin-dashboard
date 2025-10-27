import { getAuthToken } from './apiService';

const API_BASE_URL = 'https://app.evnzon.in';

/**
 * Logs in an admin using username and password.
 * Returns the token if successful.
 */
export async function loginAdmin(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: username, otp: Number(password) }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid credentials');
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('Login succeeded but no token returned.');
    }

    // Save token for future requests
    localStorage.setItem('authToken', data.access_token);

    console.log('✅ Admin logged in successfully:', data);
    return data.access_token;
  } catch (error) {
    console.error('❌ Error logging in admin:', error);
    throw error;
  }
}

/**
 * Fetches admin profile details using stored token.
 */
export async function getAdminProfile() {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('Auth token missing. Please log in again.');

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch admin profile');
    }

    const data = await response.json();
    console.log('📄 Fetched Admin Profile:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching admin profile:', error);
    throw error;
  }
}

// import { getAuthToken } from './apiService';
// import { loginAdmin } from "../services/authService";

// const API_BASE_URL = 'https://app.evnzon.in';

// /**
//  * Fetches admin profile details using stored token.
//  */
// export async function getAdminProfile() {
//   try {
//     const token = getAuthToken();
//     if (!token) throw new Error("Auth token missing. Please log in again.");

//     const response = await fetch(`${API_BASE_URL}/auth/profile`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || "Failed to fetch admin profile");
//     }

//     const data = await response.json();
//     console.log("Fetched Admin Profile:", data);
//     return data;
//   } catch (error) {
//     console.error("Error fetching admin profile:", error);
//     throw error;
//   }
// }

// // // src/services/authService.js

// // import { storeAuthToken, clearAuthToken } from './apiService';

// // const API_BASE_URL = 'https://app.evnzon.in'; // Ensure this is your correct API base URL

// // /**
// //  * Attempts to log in the admin user by sending credentials to the backend.
// //  * If successful, stores the received token.
// //  * @param {string} username - The admin's username.
// //  * @param {string} password - The admin's password.
// //  * @returns {Promise<string>} - The authentication token if login is successful.
// //  * @throws {Error} - If login fails or token is not received in the response.
// //  */
// // export async function loginAdmin(username, password) {
// //   try {
// //     // !!! IMPORTANT !!!
// //     // Replace '/admin/login' with the actual URL path
// //     // on your backend server that handles admin login requests.
// //     // This is the endpoint that will verify the username/password
// //     // and return a JWT token upon success.
// //     const loginEndpoint = `${API_BASE_URL}/auth/login`; // EXAMPLE: '/admin/login' or '/auth/token'

// //     const response = await fetch(loginEndpoint, {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //       },
// //       // !!! IMPORTANT !!!
// //       // Adjust the body structure (e.g., { username, password } or { phone, password })
// //       // to match what your backend login endpoint expects.
// //       // Sending 'phoneNumber' and 'otp' to align with your database schema.
// //       // The 'username' variable from the function argument will contain the phone number entered by the user.
// //       // The 'password' variable from the function argument will contain the OTP entered by the user.
// //       body: JSON.stringify({ phone: username, otp: Number(password) }),
// //     });

// //     if (!response.ok) {
// //       let errorDetail = `Login failed with status: ${response.status}`;
// //       try {
// //         const errorData = await response.json();
// //         errorDetail = errorData.message || errorData.error || JSON.stringify(errorData);
// //       } catch (e) {
// //         errorDetail += `, StatusText: ${response.statusText}`;
// //       }
// //       throw new Error(errorDetail);
// //     }

// //     const data = await response.json();

// //     if (data && data.access_token) { // Adjust 'data.token' if your backend uses a different key
// //       storeAuthToken(data.access_token);
// //       return data.access_token;
// //     } else {
// //       throw new Error('Login successful, but token not found in response.');
// //     }
// //   } catch (error) {
// //     throw error; // Re-throw the error so the calling component can handle it
// //   }
// // }

// // /**
// //  * Logs out the admin user by clearing the stored token.
// //  */
// // export function logoutAdmin() {
// //   clearAuthToken();
// //   // You would typically redirect the user to the login page here
// //   // For example: window.location.href = '/login';
// // }
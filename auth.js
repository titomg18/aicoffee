// Authentication Module
const Auth = (() => {
    // Key names for localStorage
    const USERS_KEY = 'registeredUsers';
    const CURRENT_USER_KEY = 'currentUser';

    // Get all registered users
    const getUsers = () => {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    };

    // Save users to localStorage
    const saveUsers = (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    };

    // Get current logged in user
    const getCurrentUser = () => {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    };

    // Register a new user
    const register = (name, userId, password) => {
        const users = getUsers();
        
        // Check if user already exists
        if (users.some(user => user.userId === userId)) {
            return { success: false, message: 'User ID already exists' };
        }
        
        // Add new user with admin privileges
        users.push({ 
            name, 
            userId, 
            password,
            isAdmin: true // Semua user adalah admin
        });
        saveUsers(users);
        
        return { success: true, message: 'Registration successful' };
    };

    // Login user
    const login = (userId, password) => {
        const users = getUsers();
        const user = users.find(u => u.userId === userId && u.password === password);
        
        if (!user) {
            return { success: false, message: 'Invalid User ID or password' };
        }
        
        // Set current user
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return { 
            success: true, 
            message: 'Login successful', 
            user,
            isAdmin: true // Selalu return true karena semua user admin
        };
    };

    // Logout user
    const logout = () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return getCurrentUser() !== null;
    };

    // Check if user is admin (selalu true)
    const isAdmin = () => {
        return true; // Karena semua user adalah admin
    };

    // Get all users (for admin)
    const getAllUsers = () => {
        return getUsers();
    };

    // Delete user by userId
    const deleteUser = (userId) => {
        const users = getUsers();
        const currentUser = getCurrentUser();
        
        // Prevent deleting current logged in user
        if (currentUser && currentUser.userId === userId) {
            return { success: false, message: 'Cannot delete currently logged in user' };
        }
        
        const filteredUsers = users.filter(user => user.userId !== userId);
        saveUsers(filteredUsers);
        return { success: true, message: 'User deleted successfully' };
    };

    // Protect routes
    const protectRoute = () => {
        const currentPath = window.location.pathname;
        
        // Redirect unauthenticated users away from protected pages
        if (!isAuthenticated()) {
            if (currentPath.includes('dashboard.html') || 
                currentPath.includes('kelolauser.html')) {
                window.location.href = 'login.html';
            }
            return;
        }
        
        // Redirect authenticated users away from auth pages
        if (currentPath.includes('login.html') || 
            currentPath.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
    };

    return {
        register,
        login,
        logout,
        getCurrentUser,
        isAuthenticated,
        isAdmin,
        getAllUsers,
        deleteUser,
        protectRoute
    };
})();

// DOM Event Listeners (same as before)
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status on page load
    Auth.protectRoute();

    // Register form handler
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const userId = document.getElementById('newUserId').value;
            const password = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            const result = Auth.register(name, userId, password);
            alert(result.message);
            
            if (result.success) {
                window.location.href = 'login.html';
            }
        });
    }

    // Login form handler
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;
            
            const result = Auth.login(userId, password);
            alert(result.message);
            
            if (result.success) {
                window.location.href = 'kelolauser.html'; // Langsung ke halaman admin
            }
        });
    }

    // Logout button handler
    if (document.getElementById('logoutBtn')) {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Auth.logout();
            window.location.href = 'login.html';
        });
    }

    // User management page logic
    if (document.getElementById('userTableBody')) {
        const loadUsers = () => {
            const users = Auth.getAllUsers();
            const tableBody = document.getElementById('userTableBody');
            const currentUser = Auth.getCurrentUser();
            
            tableBody.innerHTML = '';
            
            if (users.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4">
                            No registered users
                        </td>
                    </tr>
                `;
                return;
            }
            
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-4 py-2">${user.name}</td>
                    <td class="px-4 py-2">${user.userId}</td>
                    <td class="px-4 py-2">Admin</td> <!-- Status selalu Admin -->
                    <td class="px-4 py-2">
                        ${user.userId !== currentUser.userId 
                            ? `<button data-userid="${user.userId}" 
                               class="delete-btn bg-red-500 text-white px-3 py-1 rounded">
                                  Delete
                               </button>`
                            : '<span class="text-gray-500">Current account</span>'}
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.target.getAttribute('data-userid');
                    if (confirm(`Delete user ${userId}?`)) {
                        const result = Auth.deleteUser(userId);
                        alert(result.message);
                        loadUsers();
                    }
                });
            });
        };
        
        loadUsers();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing session
    checkAuthStatus();

    // Password strength meter
    const passwordInput = document.getElementById('password');
    const passwordStrength = document.getElementById('passwordStrength');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    if (passwordInput && passwordStrength) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = calculatePasswordStrength(password);
            updatePasswordStrengthMeter(strength);
        });
    }

    // Toggle password visibility with animation
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Add animation class
            button.classList.add('rotate-icon');
            setTimeout(() => {
                button.classList.remove('rotate-icon');
            }, 300);
            
            button.classList.toggle('fa-eye');
            button.classList.toggle('fa-eye-slash');
        });
    });

    // Login form handling with loading state
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Registration form handling with loading state
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }

    // Add input animations
    const inputs = document.querySelectorAll('.auth-form input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('input-focused');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('input-focused');
        });
    });
});

// Check authentication status
function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    if (user) {
        updateUIForLoggedInUser(user);
    }
}

// Update UI for logged-in user
function updateUIForLoggedInUser(user) {
    const loginLink = document.querySelector('a[href="login.html"]');
    if (loginLink) {
        loginLink.textContent = user.fullname;
        loginLink.href = '#';
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showUserMenu(user);
        });
    }
}

// Show user menu
function showUserMenu(user) {
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-header">
            <span>Welcome, ${user.fullname}</span>
        </div>
        <div class="user-menu-items">
            <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
            <a href="my-listings.html"><i class="fas fa-list"></i> My Listings</a>
            <a href="favorites.html"><i class="fas fa-heart"></i> Favorites</a>
            <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Add animation
    setTimeout(() => {
        menu.classList.add('show');
    }, 100);

    // Handle logout
    const logoutBtn = menu.querySelector('#logoutBtn');
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !e.target.matches('a[href="login.html"]')) {
            menu.classList.remove('show');
            setTimeout(() => {
                menu.remove();
            }, 300);
        }
    });
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Calculate password strength with enhanced criteria
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Additional checks
    if (password.length >= 16) strength += 1;
    if (/(?=.*[A-Z].*[A-Z])/.test(password)) strength += 1; // Multiple uppercase
    if (/(?=.*[!@#$%^&*].*[!@#$%^&*])/.test(password)) strength += 1; // Multiple special chars
    
    return Math.min(strength, 5);
}

// Update password strength meter with animation
function updatePasswordStrengthMeter(strength) {
    const strengthText = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    const strengthColors = ['#ff4444', '#ffbb33', '#ffeb3b', '#00C851', '#007E33'];
    
    passwordStrength.innerHTML = `
        <div class="strength-bar">
            <div class="strength-level" style="width: ${(strength / 5) * 100}%; background-color: ${strengthColors[strength - 1]}"></div>
        </div>
        <span class="strength-text" style="color: ${strengthColors[strength - 1]}">${strengthText[strength - 1]}</span>
    `;
    
    // Add animation
    const strengthLevel = passwordStrength.querySelector('.strength-level');
    strengthLevel.style.transition = 'width 0.5s ease-in-out';
}

// Handle login form submission with loading state
async function handleLogin(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Here you would typically make an API call to your backend
        const user = await simulateLogin(email, password);
        
        if (user) {
            // Store user data
            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                sessionStorage.setItem('user', JSON.stringify(user));
            }
            
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            showNotification('Invalid email or password', 'error');
            // Add shake animation to form
            event.target.classList.add('shake');
            setTimeout(() => {
                event.target.classList.remove('shake');
            }, 500);
        }
    } catch (error) {
        showNotification('An error occurred during login', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle registration form submission with loading state
async function handleRegistration(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const phone = document.getElementById('phone').value;
        const terms = document.getElementById('terms').checked;

        // Validate password match
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            // Add shake animation to password fields
            document.getElementById('password').parentElement.classList.add('shake');
            document.getElementById('confirmPassword').parentElement.classList.add('shake');
            setTimeout(() => {
                document.getElementById('password').parentElement.classList.remove('shake');
                document.getElementById('confirmPassword').parentElement.classList.remove('shake');
            }, 500);
            return;
        }

        // Validate terms acceptance
        if (!terms) {
            showNotification('Please accept the terms and conditions', 'error');
            return;
        }

        // Here you would typically make an API call to your backend
        const user = await simulateRegistration(fullname, email, password, phone);
        
        if (user) {
            showNotification('Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    } catch (error) {
        showNotification('An error occurred during registration', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Simulate login API call with delay
function simulateLogin(email, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // For demo purposes, accept any email/password combination
            resolve({
                id: 1,
                fullname: 'Demo User',
                email: email
            });
        }, 1500); // Increased delay for better UX
    });
}

// Simulate registration API call with delay
function simulateRegistration(fullname, email, password, phone) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: 1,
                fullname: fullname,
                email: email,
                phone: phone
            });
        }, 1500); // Increased delay for better UX
    });
}

// Show notification with enhanced animation
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 
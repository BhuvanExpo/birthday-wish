// Configuration
const BASE_URL = "https://birthday-wish-3zr4.onrender.com";

// DOM Elements
const form = document.getElementById('scheduler-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
const notificationContainer = document.getElementById('notification-container');
const notificationMessage = document.getElementById('notification-message');
const wishesTableBody = document.getElementById('wishes-table-body');
const feedbackForm = document.getElementById('feedback-form');
const mobileMenuToggle = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

// Auth Variables
let googleIdToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Only set min datetime if we are on the page with the form
    const sendAtInput = document.getElementById('sendAt');
    if (sendAtInput) {
        const now = new Date();
        // Format: YYYY-MM-DDThh:mm (required for datetime-local)
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        sendAtInput.min = now.toISOString().slice(0, 16);
    }

    // Auto-login if token exists in localStorage
    const savedToken = localStorage.getItem('birthdayToken');
    const savedUserStr = localStorage.getItem('birthdayUser');

    if (savedToken && savedUserStr) {
        googleIdToken = savedToken;
        const decodedPayload = JSON.parse(savedUserStr);
        updateUIForLoggedInUser(decodedPayload);

        // Fetch schedule if we are on the dashboard page
        if (wishesTableBody) {
            fetchScheduledWishes();
        }
    } else {
        // Not logged in. Only show auth message if on dashboard
        if (wishesTableBody) {
            wishesTableBody.innerHTML = `<tr><td colspan="4" class="table-loading">Please sign in to view your scheduled wishes.</td></tr>`;
        }
    }

    // Initialize Mobile Menu
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
});

// Google Sign-In Callback
function handleGoogleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    googleIdToken = response.credential;

    // Decode JWT to get user info (simple base64 decoding for frontend display)
    const base64Url = googleIdToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decodedPayload = JSON.parse(jsonPayload);

    // Save token to localStorage to persist across pages
    localStorage.setItem('birthdayToken', googleIdToken);
    localStorage.setItem('birthdayUser', JSON.stringify(decodedPayload));

    // Update UI
    updateUIForLoggedInUser(decodedPayload);

    // Fetch the user's specific scheduled wishes now that we are authenticated
    if (wishesTableBody) {
        fetchScheduledWishes();
    }
}

function updateUIForLoggedInUser(decodedPayload) {
    if (document.getElementById('google-auth-container')) {
        document.getElementById('google-auth-container').classList.add('hidden');
    }

    if (document.getElementById('scheduler-form')) {
        document.getElementById('scheduler-form').classList.remove('hidden');
    }

    if (document.getElementById('user-info-container')) {
        document.getElementById('user-info-container').classList.remove('hidden');
    }

    if (document.getElementById('user-profile-pic')) {
        document.getElementById('user-profile-pic').src = decodedPayload.picture;
    }

    if (document.getElementById('user-email-display')) {
        document.getElementById('user-email-display').textContent = decodedPayload.email;
    }
}

// Handle Sign Out
const signOutBtn = document.getElementById('sign-out-btn');
if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        googleIdToken = null;

        // Remove from localStorage
        localStorage.removeItem('birthdayToken');
        localStorage.removeItem('birthdayUser');

        if (document.getElementById('google-auth-container')) {
            document.getElementById('google-auth-container').classList.remove('hidden');
        }

        if (document.getElementById('scheduler-form')) {
            document.getElementById('scheduler-form').classList.add('hidden');
            document.getElementById('scheduler-form').reset();
        }

        if (document.getElementById('user-info-container')) {
            document.getElementById('user-info-container').classList.add('hidden');
        }

        if (wishesTableBody) {
            wishesTableBody.innerHTML = `<tr><td colspan="4" class="table-loading">Please sign in to view your scheduled wishes.</td></tr>`;
        }
    });
}

// Handle Form Submission
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!googleIdToken) {
            showNotification('Please sign in with Google first.', 'error');
            return;
        }

        // 1. Get raw input values
        const senderName = document.getElementById('senderName').value.trim();
        const receiverEmail = document.getElementById('receiverEmail').value.trim();
        const sendAtRaw = document.getElementById('sendAt').value;
        const message = document.getElementById('message').value.trim();

        // 2. Validate input quickly
        if (!senderName || !receiverEmail || !sendAtRaw || !message) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        // Convert local datetime string to UTC ISO string required by backend
        const sendAtUserLocal = new Date(sendAtRaw);
        const sendAtISO = sendAtUserLocal.toISOString();

        const payload = {
            senderName,
            receiverEmail,
            sendAt: sendAtISO,
            message
        };

        // 3. Set Loading State
        setLoadingState(true);

        try {
            // 4. Send to live Render backend
            const response = await fetch(`${BASE_URL}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${googleIdToken}` // Include the Google JWT
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // 5. Handle Response
            if (response.ok && data.success) {
                // Fire magical confetti!
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 } // Start slightly lower than center
                    });
                }

                showNotification('Birthday wish scheduled successfully! 🎉', 'success');
                form.reset();
                // Refresh table to show newly scheduled wish
                fetchScheduledWishes();

                // Show the feedback container and scroll to it
                const feedbackContainer = document.getElementById('feedback-container');
                if (feedbackContainer) {
                    feedbackContainer.style.display = 'block';
                    feedbackContainer.classList.remove('hidden');
                    setTimeout(() => {
                        feedbackContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            } else {
                // Server responded with an error message
                let errMsg = data.message || 'Failed to schedule wish. Please try again.';

                // Extract specific validation error if present
                if (data.error && Array.isArray(data.error) && data.error.length > 0) {
                    errMsg = data.error[0].msg;
                }

                showNotification(errMsg, 'error');
            }

        } catch (error) {
            console.error('Submission Error:', error);
            showNotification('Network error. Is the server online?', 'error');
        } finally {
            // Always remove loading state
            setLoadingState(false);
        }
    });
}

// UI Helpers
function setLoadingState(isLoading) {
    if (!submitBtn) return;

    if (isLoading) {
        submitBtn.disabled = true;
        btnText.textContent = 'Scheduling...';
        btnSpinner.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        btnText.textContent = 'Schedule Email';
        btnSpinner.classList.add('hidden');
    }
}

let notificationTimeout;

function showNotification(message, type) {
    // Clear any existing timeout so they don't overlap
    if (notificationTimeout) clearTimeout(notificationTimeout);

    notificationMessage.textContent = message;

    // Reset classes
    notificationContainer.className = 'notification';

    if (type === 'error') {
        notificationContainer.classList.add('error');
        notificationContainer.querySelector('.notification-icon').textContent = '⚠️';
    } else {
        notificationContainer.querySelector('.notification-icon').textContent = '✓';
    }

    // Show wrapper
    notificationContainer.classList.remove('hidden');

    // Trigger slide in
    // setTimeout needed for CSS transition to trigger after removing 'hidden'
    setTimeout(() => {
        notificationContainer.classList.add('show');
    }, 10);

    // Auto hide after 4 seconds
    notificationTimeout = setTimeout(() => {
        notificationContainer.classList.remove('show');
        setTimeout(() => {
            notificationContainer.classList.add('hidden');
        }, 400); // Wait for transition to finish
    }, 4000);
}

// Fetch Logic
async function fetchScheduledWishes() {
    if (!googleIdToken) {
        wishesTableBody.innerHTML = `<tr><td colspan="4" class="table-loading">Please sign in to view your scheduled wishes.</td></tr>`;
        return;
    }

    try {
        // Fetch specific to the authenticated user
        const response = await fetch(`${BASE_URL}/schedule`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${googleIdToken}` // Include the Google JWT
            }
        });

        if (!response.ok) {
            throw new Error(`Endpoint /schedule returned ${response.status}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.data.wishes)) {
            renderWishesTable(data.data.wishes);
        } else {
            wishesTableBody.innerHTML = `<tr><td colspan="4" class="table-loading">No scheduled wishes found.</td></tr>`;
        }

    } catch (error) {
        console.warn('Wishes fetch logic bypassed (Endpoint might not exist yet on backend):', error);
        wishesTableBody.innerHTML = `<tr><td colspan="4" class="table-loading" style="color:var(--text-secondary); opacity: 0.7;">Create a GET /wishes route on your backend to populate this dashboard!</td></tr>`;
    }
}

function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
        return `${localPart[0]}***@${domain}`;
    }
    const maskedLocal = localPart.slice(0, 3) + '***';
    return `${maskedLocal}@${domain}`;
}

function renderWishesTable(wishes) {
    if (wishes.length === 0) {
        wishesTableBody.innerHTML = `<tr><td colspan="4" class="table-loading">No scheduled wishes yet. Create one above!</td></tr>`;
        return;
    }

    wishesTableBody.innerHTML = wishes.map(wish => {
        // Format date to local readable format
        const dateObj = new Date(wish.sendAt);
        const formattedDate = dateObj.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = dateObj.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Determine specific style based on string status
        const statusClass = `status-badge status-${wish.status.toLowerCase()}`;

        return `
            <tr>
                <td>${escapeHtml(wish.senderName)}</td>
                <td>${escapeHtml(maskEmail(wish.receiverEmail))}</td>
                <td>
                    <div style="font-weight: 500">${formattedDate}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary)">${formattedTime}</div>
                </td>
                <td><span class="${statusClass}">${wish.status.toUpperCase()}</span></td>
            </tr>
        `;
    }).join('');
}

// Security Helper to prevent HTML injection if backend doesn't sanitize
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Handle Feedback Form Submission
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('feedbackName').value.trim();
        const email = document.getElementById('feedbackEmail').value.trim();
        const message = document.getElementById('feedbackMessage').value.trim();

        if (!message) {
            showNotification('Please enter a message', 'error');
            return;
        }

        const submitBtn = document.getElementById('feedback-submit-btn');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Submitting...';
        submitBtn.querySelector('.btn-spinner').classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${BASE_URL}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });

            if (response.ok) {
                showNotification('Feedback received. Thank you!', 'success');
                feedbackForm.reset();
                // Optionally hide it again on the main page after successful submission
                const feedbackContainer = document.getElementById('feedback-container');
                if (feedbackContainer) {
                    setTimeout(() => {
                        feedbackContainer.style.display = 'none';
                    }, 3000);
                }
            } else {
                showNotification('Error submitting feedback', 'error');
            }
        } catch (error) {
            console.error('Feedback Error:', error);
            showNotification('Network error.', 'error');
        } finally {
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.querySelector('.btn-spinner').classList.add('hidden');
            submitBtn.disabled = false;
        }
    });
}

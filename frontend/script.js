// Configuration
const BASE_URL = "https://birthday-wish-3zr4.onrender.com";

// DOM Elements
const form = document.getElementById('scheduler-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnSpinner = submitBtn.querySelector('.btn-spinner');
const notificationContainer = document.getElementById('notification-container');
const notificationMessage = document.getElementById('notification-message');
const wishesTableBody = document.getElementById('wishes-table-body');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set min datetime to current time
    const now = new Date();
    // Format: YYYY-MM-DDThh:mm (required for datetime-local)
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('sendAt').min = now.toISOString().slice(0, 16);

    // Fetch initial data
    fetchScheduledWishes();
});

// Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 5. Handle Response
        if (response.ok && data.success) {
            showNotification('Birthday wish scheduled successfully! 🎉', 'success');
            form.reset();
            // Refresh table to show newly scheduled wish
            fetchScheduledWishes();
        } else {
            // Server responded with an error message
            const errMsg = data.message || 'Failed to schedule wish. Please try again.';
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

// UI Helpers
function setLoadingState(isLoading) {
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
    try {
        // First check if the route exists on the backend.
        // It's possible the user only implemented /insert and not /wishes yet.
        const response = await fetch(`${BASE_URL}/schedule`);

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
                <td>${escapeHtml(wish.receiverEmail)}</td>
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

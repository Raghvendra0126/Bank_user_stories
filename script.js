// ==================== DATA MANAGEMENT ====================

// Initialize localStorage with sample data if not exists
function initializeData() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify({}));
    }
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', '');
    }
}

initializeData();

// Generate random account ID
function generateAccountId() {
    return 'US' + Math.random().toString().substr(2, 9);
}

// Get all users
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || {};
}

// Get current logged-in user
function getCurrentUser() {
    const accountId = localStorage.getItem('currentUser');
    if (!accountId) return null;
    const users = getAllUsers();
    return users[accountId] ? { id: accountId, ...users[accountId] } : null;
}

// Check if user is logged in
function isUserLoggedIn() {
    return !!localStorage.getItem('currentUser');
}

// ==================== REGISTRATION ====================

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', handleDeposit);
    }

    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', handleWithdraw);
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Check if user should be on this page
    checkPageAccess();
});

function handleRegistration(e) {
    e.preventDefault();

    const aadharId = document.getElementById('aadharId').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const address = document.getElementById('address').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();

    // Validation
    if (!aadharId) {
        showError('Aadhar ID is required', 'errorModal');
        return;
    }

    if (password !== confirmPassword) {
        showError('Password and Confirm Password must be the same', 'errorModal');
        return;
    }

    if (password.length > 30) {
        showError('Password must not exceed 30 characters', 'errorModal');
        return;
    }

    if (contactNumber.length !== 10) {
        showError('Contact number must be 10 digits', 'errorModal');
        return;
    }

    if (firstName.length > 50 || lastName.length > 50) {
        showError('First name and Last name must not exceed 50 characters', 'errorModal');
        return;
    }

    if (address.length > 100) {
        showError('Address must not exceed 100 characters', 'errorModal');
        return;
    }

    // Check for email duplication
    const users = getAllUsers();
    for (let userId in users) {
        if (users[userId].email === email) {
            showError('This email is already registered', 'errorModal');
            return;
        }
    }

    // Create new user
    const accountId = generateAccountId();
    const newUser = {
        accountId: accountId,
        aadharId: aadharId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password, // Note: In production, this should be hashed
        address: address,
        contactNumber: contactNumber,
        balance: 0,
        maritalStatus: '',
        dateOfBirth: '',
        gender: '',
        panCard: '',
        transactions: []
    };

    users[accountId] = newUser;
    localStorage.setItem('users', JSON.stringify(users));

    // Show success modal with account number
    showSuccessRegistration(accountId);
}

function showSuccessRegistration(accountId) {
    const modal = document.getElementById('successModal');
    document.getElementById('accountNumberDisplay').innerHTML = `<strong>Account Number: ${accountId}</strong>`;
    modal.classList.add('show');
}

function redirectToLogin() {
    document.getElementById('successModal').classList.remove('show');
    window.location.href = 'login.html';
}

// ==================== LOGIN ====================

function handleLogin(e) {
    e.preventDefault();

    const accountId = document.getElementById('loginAccountId').value.trim();
    const password = document.getElementById('loginPassword').value;

    const users = getAllUsers();

    if (!users[accountId]) {
        showError('Account not found', 'loginErrorModal');
        return;
    }

    if (users[accountId].password !== password) {
        showError('Incorrect password', 'loginErrorModal');
        return;
    }

    // Login successful
    localStorage.setItem('currentUser', accountId);
    showSuccessLogin(users[accountId]);
}

function showSuccessLogin(user) {
    const modal = document.getElementById('loginSuccessModal');
    document.getElementById('welcomeMessage').textContent = `Welcome back, ${user.firstName} ${user.lastName}!`;
    modal.classList.add('show');
}

function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

// ==================== DASHBOARD ====================

function loadDashboardData() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('summaryAccountId').textContent = user.id;
    document.getElementById('summaryCustomerName').textContent = user.firstName + ' ' + user.lastName;
    document.getElementById('summaryEmail').textContent = user.email;
    document.getElementById('accountBalance').textContent = '$' + user.balance.toFixed(2);

    // Load transactions
    loadTransactions(user.transactions || []);
}

function loadTransactions(transactions) {
    const tbody = document.getElementById('transactionsBody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No transactions yet</td></tr>';
        return;
    }

    transactions.reverse().forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.type}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td>$${transaction.balance.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== DEPOSIT ====================

function loadDepositPageData() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('currentBalance').textContent = '$' + user.balance.toFixed(2);
}

function updateDepositPreview() {
    const user = getCurrentUser();
    const amount = parseFloat(document.getElementById('depositAmount').value) || 0;
    const newBalance = user.balance + amount;

    document.getElementById('amountToDeposit').textContent = '$' + amount.toFixed(2);
    document.getElementById('newBalance').textContent = '$' + newBalance.toFixed(2);
}

function handleDeposit(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const amount = parseFloat(document.getElementById('depositAmount').value);
    const description = document.getElementById('depositDescription').value.trim();

    if (amount <= 0) {
        showError('Deposit amount must be greater than 0', 'depositErrorModal');
        return;
    }

    // Update user balance
    user.balance += amount;

    // Add transaction
    const transaction = {
        date: new Date().toLocaleDateString(),
        type: 'Deposit',
        amount: amount,
        balance: user.balance,
        description: description
    };

    if (!user.transactions) {
        user.transactions = [];
    }
    user.transactions.push(transaction);

    // Save updated user
    const users = getAllUsers();
    users[user.id] = user;
    localStorage.setItem('users', JSON.stringify(users));

    // Show success
    showSuccessDeposit(amount, user.balance);
}

function showSuccessDeposit(amount, newBalance) {
    const modal = document.getElementById('depositSuccessModal');
    document.getElementById('depositedAmount').textContent = '$' + amount.toFixed(2);
    document.getElementById('newBalanceDisplay').textContent = '$' + newBalance.toFixed(2);
    modal.classList.add('show');
}

// ==================== WITHDRAW ====================

function loadWithdrawPageData() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('currentWithdrawBalance').textContent = '$' + user.balance.toFixed(2);
}

function updateWithdrawPreview() {
    const user = getCurrentUser();
    const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;
    const newBalance = user.balance - amount;

    document.getElementById('amountToWithdraw').textContent = '$' + amount.toFixed(2);
    document.getElementById('newWithdrawBalance').textContent = '$' + newBalance.toFixed(2);
}

function handleWithdraw(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const description = document.getElementById('withdrawDescription').value.trim();

    // Validation
    if (amount <= 0) {
        showError('Withdrawal amount must be greater than 0', 'withdrawErrorModal');
        return;
    }

    if (amount > 1000) {
        showError('Maximum withdrawal amount is $1000', 'withdrawErrorModal');
        return;
    }

    if (amount > user.balance) {
        showError('Insufficient balance for this withdrawal', 'withdrawErrorModal');
        return;
    }

    const remainingBalance = user.balance - amount;
    if (remainingBalance < 500 && remainingBalance !== 0) {
        showError('Minimum balance after withdrawal should be $500. You cannot withdraw this amount.', 'withdrawErrorModal');
        return;
    }

    // Update user balance
    user.balance -= amount;

    // Add transaction
    const transaction = {
        date: new Date().toLocaleDateString(),
        type: 'Withdrawal',
        amount: amount,
        balance: user.balance,
        description: description
    };

    if (!user.transactions) {
        user.transactions = [];
    }
    user.transactions.push(transaction);

    // Save updated user
    const users = getAllUsers();
    users[user.id] = user;
    localStorage.setItem('users', JSON.stringify(users));

    // Show success
    showSuccessWithdraw(amount, user.balance);
}

function showSuccessWithdraw(amount, newBalance) {
    const modal = document.getElementById('withdrawSuccessModal');
    document.getElementById('withdrawnAmount').textContent = '$' + amount.toFixed(2);
    document.getElementById('newWithdrawBalanceDisplay').textContent = '$' + newBalance.toFixed(2);
    modal.classList.add('show');
}

// ==================== PROFILE ====================

function loadProfileData() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('profileAccountId').value = user.id;
    document.getElementById('profileCustomerName').value = user.firstName + ' ' + user.lastName;
    document.getElementById('profileAadharId').value = user.aadharId;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileAddress').value = user.address;
    document.getElementById('profileContactNumber').value = user.contactNumber;
    document.getElementById('profileMaritalStatus').value = user.maritalStatus || '';
    document.getElementById('profileDateOfBirth').value = user.dateOfBirth || '';
    document.getElementById('profileGender').value = user.gender || '';
    document.getElementById('profilePanCard').value = user.panCard || '';
}

function handleProfileUpdate(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const customerName = document.getElementById('profileCustomerName').value.trim();
    const aadharId = document.getElementById('profileAadharId').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const address = document.getElementById('profileAddress').value.trim();
    const contactNumber = document.getElementById('profileContactNumber').value.trim();
    const maritalStatus = document.getElementById('profileMaritalStatus').value;
    const dateOfBirth = document.getElementById('profileDateOfBirth').value;
    const gender = document.getElementById('profileGender').value;
    const panCard = document.getElementById('profilePanCard').value.trim();

    // Validation
    if (contactNumber.length !== 10) {
        showError('Contact number must be 10 digits', 'profileErrorModal');
        return;
    }

    if (address.length > 100) {
        showError('Address must not exceed 100 characters', 'profileErrorModal');
        return;
    }

    // Update user info
    const nameParts = customerName.split(' ');
    user.firstName = nameParts[0];
    user.lastName = nameParts.slice(1).join(' ') || nameParts[0];
    user.aadharId = aadharId;
    user.email = email;
    user.address = address;
    user.contactNumber = contactNumber;
    user.maritalStatus = maritalStatus;
    user.dateOfBirth = dateOfBirth;
    user.gender = gender;
    user.panCard = panCard;

    // Save updated user
    const users = getAllUsers();
    users[user.id] = user;
    localStorage.setItem('users', JSON.stringify(users));

    // Show success
    showSuccessProfile();
}

function showSuccessProfile() {
    const modal = document.getElementById('profileSuccessModal');
    modal.classList.add('show');
}

// ==================== UTILITY FUNCTIONS ====================

function showError(message, modalId) {
    const modal = document.getElementById(modalId);
    if (modalId === 'errorModal') {
        document.getElementById('errorMessage').textContent = message;
    } else if (modalId === 'loginErrorModal') {
        document.getElementById('loginErrorMessage').textContent = message;
    } else if (modalId === 'depositErrorModal') {
        document.getElementById('depositErrorMessage').textContent = message;
    } else if (modalId === 'withdrawErrorModal') {
        document.getElementById('withdrawErrorMessage').textContent = message;
    } else if (modalId === 'profileErrorModal') {
        document.getElementById('profileErrorMessage').textContent = message;
    }
    modal.classList.add('show');
}

function closeErrorModal() {
    document.getElementById('errorModal').classList.remove('show');
}

function closeLoginErrorModal() {
    document.getElementById('loginErrorModal').classList.remove('show');
}

function closeDepositErrorModal() {
    document.getElementById('depositErrorModal').classList.remove('show');
}

function closeWithdrawErrorModal() {
    document.getElementById('withdrawErrorModal').classList.remove('show');
}

function closeProfileErrorModal() {
    document.getElementById('profileErrorModal').classList.remove('show');
}

function logout(e) {
    if (e) e.preventDefault();
    localStorage.setItem('currentUser', '');
    window.location.href = 'index.html';
}

function checkPageAccess() {
    const currentPage = window.location.pathname;
    const isLoggedIn = isUserLoggedIn();

    // Pages that require login
    const protectedPages = ['dashboard.html', 'deposit.html', 'withdraw.html', 'profile.html'];
    const isProtectedPage = protectedPages.some(page => currentPage.includes(page));

    if (isProtectedPage && !isLoggedIn) {
        window.location.href = 'login.html';
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
});

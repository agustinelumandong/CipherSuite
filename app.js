// User Data Storage (simulating database)
const userData = {
    users: {},
    currentUser: null,
    blockedUsers: new Set()
};

// Application State
const appState = {
    currentCipher: null,
    isLoggedIn: false
};

// Authentication Functions
function validateUsername(username) {
    return username.length >= 6 && /^[a-zA-Z0-9]+$/.test(username);
}

function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    return {
        isValid: Object.values(requirements).every(req => req),
        requirements
    };
}

function updatePasswordRequirements(password) {
    const validation = validatePassword(password);
    const requirements = validation.requirements;
    
    updateRequirement('length-req', requirements.length, 'At least 8 characters');
    updateRequirement('uppercase-req', requirements.uppercase, 'One uppercase letter');
    updateRequirement('lowercase-req', requirements.lowercase, 'One lowercase letter');
    updateRequirement('number-req', requirements.number, 'One number');
    updateRequirement('special-req', requirements.special, 'One special character');
}

function updateRequirement(id, met, text) {
    const element = document.getElementById(id);
    if (element) {
        element.className = `requirement ${met ? 'met' : 'unmet'}`;
        element.innerHTML = `${met ? '✓' : '✗'} ${text}`;
    }
}

function registerUser(username, password) {
    console.log('Attempting to register user:', username);
    
    if (!validateUsername(username)) {
        return { success: false, message: 'Username must be at least 6 characters and contain only letters and numbers' };
    }
    
    if (userData.users[username]) {
        return { success: false, message: 'Username already exists' };
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        return { success: false, message: 'Password does not meet requirements' };
    }
    
    userData.users[username] = {
        password: password,
        loginAttempts: 0,
        createdAt: new Date().toISOString()
    };
    
    console.log('User registered successfully:', username);
    console.log('Current users:', Object.keys(userData.users));
    
    return { success: true, message: 'Registration successful' };
}

function loginUser(username, password) {
    console.log('Attempting to login user:', username);
    console.log('Available users:', Object.keys(userData.users));
    
    if (userData.blockedUsers.has(username)) {
        return { success: false, message: 'Account is blocked due to too many failed login attempts' };
    }
    
    const user = userData.users[username];
    if (!user) {
        return { success: false, message: 'Invalid username or password' };
    }
    
    if (user.password === password) {
        user.loginAttempts = 0;
        userData.currentUser = username;
        appState.isLoggedIn = true;
        console.log('Login successful for:', username);
        return { success: true, message: 'Login successful' };
    } else {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        const attemptsLeft = 3 - user.loginAttempts;
        
        if (user.loginAttempts >= 3) {
            userData.blockedUsers.add(username);
            return { 
                success: false, 
                message: 'Account blocked due to too many failed login attempts',
                blocked: true 
            };
        }
        
        return { 
            success: false, 
            message: 'Invalid username or password',
            attemptsLeft: attemptsLeft
        };
    }
}

function logout() {
    userData.currentUser = null;
    appState.isLoggedIn = false;
    appState.currentCipher = null;
    showAuthContainer();
    clearForms();
}

// Cipher Algorithms
class CipherSuite {
    static atbash(text) {
        return text.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
                return String.fromCharCode(25 - (char.charCodeAt(0) - 65) + 65);
            } else if (char >= 'a' && char <= 'z') {
                return String.fromCharCode(25 - (char.charCodeAt(0) - 97) + 97);
            }
            return char;
        }).join('');
    }
    
    static caesar(text, shift, decrypt = false) {
        if (decrypt) shift = -shift;
        
        return text.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
                return String.fromCharCode(((char.charCodeAt(0) - 65 + shift + 26) % 26) + 65);
            } else if (char >= 'a' && char <= 'z') {
                return String.fromCharCode(((char.charCodeAt(0) - 97 + shift + 26) % 26) + 97);
            }
            return char;
        }).join('');
    }
    
    static vigenere(text, keyword, decrypt = false) {
        if (!keyword || !/^[a-zA-Z]+$/.test(keyword)) {
            throw new Error('Keyword must contain only letters');
        }
        
        keyword = keyword.toUpperCase();
        let keywordIndex = 0;
        
        return text.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
                const shift = keyword.charCodeAt(keywordIndex % keyword.length) - 65;
                keywordIndex++;
                const charCode = char.charCodeAt(0) - 65;
                const newCharCode = decrypt ? 
                    (charCode - shift + 26) % 26 : 
                    (charCode + shift) % 26;
                return String.fromCharCode(newCharCode + 65);
            } else if (char >= 'a' && char <= 'z') {
                const shift = keyword.charCodeAt(keywordIndex % keyword.length) - 65;
                keywordIndex++;
                const charCode = char.charCodeAt(0) - 97;
                const newCharCode = decrypt ? 
                    (charCode - shift + 26) % 26 : 
                    (charCode + shift) % 26;
                return String.fromCharCode(newCharCode + 97);
            }
            return char;
        }).join('');
    }
}

// UI Functions
function showAuthContainer() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) authContainer.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
    
    showLoginForm();
}

function showAppContainer() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) authContainer.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
    
    const userElement = document.getElementById('currentUser');
    if (userElement) {
        userElement.textContent = `Welcome, ${userData.currentUser}`;
    }
    showCipherSelection();
}

function showLoginForm() {
    console.log('Showing login form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.classList.remove('hidden');
        console.log('Login form shown');
    }
    if (registerForm) {
        registerForm.classList.add('hidden');
        console.log('Register form hidden');
    }
    clearForms();
}

function showRegisterForm() {
    console.log('Showing register form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.classList.add('hidden');
        console.log('Login form hidden');
    }
    if (registerForm) {
        registerForm.classList.remove('hidden');
        console.log('Register form shown');
    }
    clearForms();
    
    // Initialize password requirements when showing register form
    setTimeout(() => {
        updatePasswordRequirements('');
    }, 100);
}

function showCipherSelection() {
    const cipherSelectionEl = document.querySelector('.cipher-selection');
    const cipherInterface = document.getElementById('cipher-interface');
    
    if (cipherSelectionEl) cipherSelectionEl.classList.remove('hidden');
    if (cipherInterface) cipherInterface.classList.add('hidden');
    
    appState.currentCipher = null;
}

function showCipherInterface(cipherType) {
    const cipherSelectionEl = document.querySelector('.cipher-selection');
    const cipherInterface = document.getElementById('cipher-interface');
    
    if (cipherSelectionEl) cipherSelectionEl.classList.add('hidden');
    if (cipherInterface) cipherInterface.classList.remove('hidden');
    
    appState.currentCipher = cipherType;
    
    // Update interface title and show appropriate controls
    const titleMap = {
        'atbash': 'Atbash Cipher',
        'caesar': 'Caesar Cipher',
        'vigenere': 'Vigenere Cipher'
    };
    
    const titleElement = document.getElementById('selectedCipherTitle');
    if (titleElement) {
        titleElement.textContent = titleMap[cipherType];
    }
    
    // Hide all cipher-specific controls
    const caesarControls = document.getElementById('caesar-controls');
    const vigenereControls = document.getElementById('vigenere-controls');
    
    if (caesarControls) caesarControls.classList.add('hidden');
    if (vigenereControls) vigenereControls.classList.add('hidden');
    
    // Show specific controls
    if (cipherType === 'caesar' && caesarControls) {
        caesarControls.classList.remove('hidden');
    } else if (cipherType === 'vigenere' && vigenereControls) {
        vigenereControls.classList.remove('hidden');
    }
    
    // Clear previous input/output
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    if (inputText) inputText.value = '';
    if (outputText) outputText.value = '';
}

function clearForms() {
    // Clear auth forms
    const loginFormEl = document.getElementById('loginForm');
    const registerFormEl = document.getElementById('registerForm');
    
    if (loginFormEl) loginFormEl.reset();
    if (registerFormEl) registerFormEl.reset();
    
    // Clear error messages
    document.querySelectorAll('.error-message, .validation-message, .attempts-counter').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
    
    // Reset password requirements
    document.querySelectorAll('.requirement').forEach(req => {
        if (req.innerHTML.includes('✓')) {
            req.innerHTML = req.innerHTML.replace('✓', '✗');
        }
        req.className = 'requirement unmet';
    });
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
        console.log('Showing error:', message);
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
        element.textContent = '';
    }
}

function showSuccess(message) {
    const successMessageEl = document.getElementById('successMessage');
    const successModal = document.getElementById('successModal');
    
    if (successMessageEl && successModal) {
        successMessageEl.textContent = message;
        successModal.classList.remove('hidden');
    }
}

function performCipherOperation(encrypt = true) {
    const inputText = document.getElementById('inputText')?.value?.trim();
    if (!inputText) {
        alert('Please enter text to process');
        return;
    }
    
    try {
        let result = '';
        
        switch (appState.currentCipher) {
            case 'atbash':
                result = CipherSuite.atbash(inputText);
                break;
                
            case 'caesar':
                const shiftElement = document.getElementById('shiftValue');
                const shift = parseInt(shiftElement?.value || 3);
                if (isNaN(shift) || shift < 1 || shift > 25) {
                    alert('Please enter a valid shift value (1-25)');
                    return;
                }
                result = CipherSuite.caesar(inputText, shift, !encrypt);
                break;
                
            case 'vigenere':
                const keywordElement = document.getElementById('keyword');
                const keyword = keywordElement?.value?.trim();
                if (!keyword) {
                    alert('Please enter a keyword');
                    return;
                }
                if (!/^[a-zA-Z]+$/.test(keyword)) {
                    alert('Keyword must contain only letters');
                    return;
                }
                result = CipherSuite.vigenere(inputText, keyword, !encrypt);
                break;
        }
        
        const outputTextEl = document.getElementById('outputText');
        if (outputTextEl) {
            outputTextEl.value = result;
        }
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function copyToClipboard() {
    const outputText = document.getElementById('outputText')?.value;
    if (!outputText) {
        alert('No text to copy');
        return;
    }
    
    navigator.clipboard.writeText(outputText).then(() => {
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copy-success');
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('copy-success');
            }, 2000);
        }
    }).catch(() => {
        // Fallback for browsers that don't support clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = outputText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        showSuccess('Text copied to clipboard!');
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing application');
    
    // Auth form toggles
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    
    console.log('Setting up toggle buttons');
    console.log('showRegister button:', showRegisterBtn);
    console.log('showLogin button:', showLoginBtn);
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Register button clicked');
            showRegisterForm();
        });
        console.log('Register button listener added');
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Login button clicked');
            showLoginForm();
        });
        console.log('Login button listener added');
    }
    
    // Registration form
    const registerFormEl = document.getElementById('registerForm');
    if (registerFormEl) {
        registerFormEl.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Registration form submitted');
            
            const username = document.getElementById('registerUsername')?.value?.trim();
            const password = document.getElementById('registerPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            
            console.log('Registration data:', { username, passwordLength: password?.length });
            
            hideError('register-error');
            
            if (!username || !password) {
                showError('register-error', 'Please fill in all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('register-error', 'Passwords do not match');
                return;
            }
            
            const result = registerUser(username, password);
            if (result.success) {
                showSuccess(result.message + ' You can now login.');
                setTimeout(() => {
                    showLoginForm();
                }, 2000);
            } else {
                showError('register-error', result.message);
            }
        });
    }
    
    // Login form
    const loginFormEl = document.getElementById('loginForm');
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            
            const username = document.getElementById('loginUsername')?.value?.trim();
            const password = document.getElementById('loginPassword')?.value;
            
            console.log('Login attempt for:', username);
            
            hideError('login-error');
            hideError('login-attempts');
            
            if (!username || !password) {
                showError('login-error', 'Please enter username and password');
                return;
            }
            
            const result = loginUser(username, password);
            console.log('Login result:', result);
            
            if (result.success) {
                console.log('Login successful, showing app container');
                showAppContainer();
            } else {
                showError('login-error', result.message);
                
                if (result.attemptsLeft && !result.blocked) {
                    const attemptsEl = document.getElementById('login-attempts');
                    if (attemptsEl) {
                        attemptsEl.textContent = `${result.attemptsLeft} attempt(s) remaining`;
                        attemptsEl.classList.remove('hidden');
                    }
                }
            }
        });
    }
    
    // Password validation real-time
    const registerPasswordEl = document.getElementById('registerPassword');
    if (registerPasswordEl) {
        registerPasswordEl.addEventListener('input', function(e) {
            updatePasswordRequirements(e.target.value);
        });
    }
    
    // Confirm password validation
    const confirmPasswordEl = document.getElementById('confirmPassword');
    if (confirmPasswordEl) {
        confirmPasswordEl.addEventListener('input', function(e) {
            const password = document.getElementById('registerPassword')?.value || '';
            const confirmPassword = e.target.value;
            const validationEl = document.getElementById('confirm-validation');
            
            if (validationEl) {
                if (confirmPassword === '') {
                    validationEl.textContent = '';
                    validationEl.className = 'validation-message';
                } else if (password === confirmPassword) {
                    validationEl.textContent = 'Passwords match';
                    validationEl.className = 'validation-message valid';
                } else {
                    validationEl.textContent = 'Passwords do not match';
                    validationEl.className = 'validation-message invalid';
                }
            }
        });
    }
    
    // Username validation
    const registerUsernameEl = document.getElementById('registerUsername');
    if (registerUsernameEl) {
        registerUsernameEl.addEventListener('input', function(e) {
            const username = e.target.value;
            const validationEl = document.getElementById('username-validation');
            
            if (validationEl) {
                if (username === '') {
                    validationEl.textContent = '';
                    validationEl.className = 'validation-message';
                } else if (validateUsername(username)) {
                    validationEl.textContent = 'Username is valid';
                    validationEl.className = 'validation-message valid';
                } else {
                    validationEl.textContent = 'Username must be at least 6 characters (letters and numbers only)';
                    validationEl.className = 'validation-message invalid';
                }
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Cipher selection
    document.querySelectorAll('.cipher-card').forEach(card => {
        card.addEventListener('click', function() {
            const cipherType = this.dataset.cipher;
            showCipherInterface(cipherType);
        });
    });
    
    // Back to selection
    const backToSelectionBtn = document.getElementById('backToSelection');
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', showCipherSelection);
    }
    
    // Cipher operations
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    
    if (encryptBtn) {
        encryptBtn.addEventListener('click', () => performCipherOperation(true));
    }
    
    if (decryptBtn) {
        decryptBtn.addEventListener('click', () => performCipherOperation(false));
    }
    
    // Clear form
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            const inputTextEl = document.getElementById('inputText');
            const outputTextEl = document.getElementById('outputText');
            
            if (inputTextEl) inputTextEl.value = '';
            if (outputTextEl) outputTextEl.value = '';
            
            if (appState.currentCipher === 'caesar') {
                const shiftValueEl = document.getElementById('shiftValue');
                if (shiftValueEl) shiftValueEl.value = '3';
            } else if (appState.currentCipher === 'vigenere') {
                const keywordEl = document.getElementById('keyword');
                if (keywordEl) keywordEl.value = '';
            }
        });
    }
    
    // Copy to clipboard
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }
    
    // Modal close
    const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
    if (closeSuccessModalBtn) {
        closeSuccessModalBtn.addEventListener('click', function() {
            const successModal = document.getElementById('successModal');
            if (successModal) {
                successModal.classList.add('hidden');
            }
        });
    }
    
    // Click outside modal to close
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.addEventListener('click', function(e) {
            if (e.target === successModal) {
                successModal.classList.add('hidden');
            }
        });
    }
    
    // Initialize password requirements display
    updatePasswordRequirements('');
    
    // Initialize app
    console.log('Initializing app - showing auth container');
    showAuthContainer();
});
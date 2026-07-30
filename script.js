/**
 * ==============================================================================
 * DEVOTIONAL PAYMENT FORM - ISKCON TIRUPATI SRI KRISHNA JANMASHTAMI SHYAMA
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let screenshotBase64 = null;
    let screenshotFileName = null;
    const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1Gz2Gmm8Xfx-XR1a0bdEecVGjjJlx2Sn4YW-aIHn9Bd6PRaJ9yX2ct2k04zFUFYCU/exec';
    let appsScriptUrl = localStorage.getItem('DEVOTIONAL_APPS_SCRIPT_URL') || DEFAULT_APPS_SCRIPT_URL;

    // --- DOM Elements ---
    const paymentForm = document.getElementById('paymentForm');
    const fullNameInput = document.getElementById('fullName');
    const schoolNameInput = document.getElementById('schoolName');
    const classNameInput = document.getElementById('className');
    const sectionInput = document.getElementById('section');
    const phoneInput = document.getElementById('phone');

    // Upload Elements
    const dropZone = document.getElementById('dropZone');
    const screenshotInput = document.getElementById('screenshotInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewWrapper = document.getElementById('previewWrapper');
    const imagePreview = document.getElementById('imagePreview');
    const previewFilename = document.getElementById('previewFilename');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const uploadError = document.getElementById('uploadError');

    // Submit Lock Elements
    const submitBtn = document.getElementById('submitBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const lockStatusBanner = document.getElementById('lockStatusBanner');

    // Copy UPI & Config Elements
    const copyUpiBtn = document.getElementById('copyUpiBtn');
    const upiIdText = document.getElementById('upiIdText');
    const openConfigBtn = document.getElementById('openConfigBtn');
    const configModal = document.getElementById('configModal');
    const closeConfigBtn = document.getElementById('closeConfigBtn');
    const cancelConfigBtn = document.getElementById('cancelConfigBtn');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const appsScriptUrlInput = document.getElementById('appsScriptUrlInput');

    // Success Modal Elements
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const sumName = document.getElementById('sumName');
    const sumSchool = document.getElementById('sumSchool');
    const sumClassSection = document.getElementById('sumClassSection');
    const sumPhone = document.getElementById('sumPhone');

    // Toast Element
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    // Load saved Apps Script URL
    if (appsScriptUrl) {
        appsScriptUrlInput.value = appsScriptUrl;
    }

    // ==========================================================================
    // 1. COPY UPI ID FEATURE
    // ==========================================================================
    copyUpiBtn.addEventListener('click', () => {
        const upiId = upiIdText.innerText.trim();
        navigator.clipboard.writeText(upiId).then(() => {
            showToast('UPI ID copied to clipboard: ' + upiId, 'success');
        }).catch(() => {
            showToast('Failed to copy UPI ID automatically', 'error');
        });
    });

    // ==========================================================================
    // 2. CONFIG SETTINGS MODAL (Google Apps Script URL)
    // ==========================================================================
    if (openConfigBtn) {
        openConfigBtn.addEventListener('click', () => {
            configModal.classList.remove('hidden');
        });
    }

    [closeConfigBtn, cancelConfigBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            configModal.classList.add('hidden');
        });
    });

    saveConfigBtn.addEventListener('click', () => {
        const url = appsScriptUrlInput.value.trim();
        appsScriptUrl = url;
        localStorage.setItem('DEVOTIONAL_APPS_SCRIPT_URL', url);
        configModal.classList.add('hidden');
        if (url) {
            showToast('Google Apps Script Web App URL saved successfully!', 'success');
        } else {
            showToast('Apps Script URL cleared.', 'info');
        }
    });

    // ==========================================================================
    // 3. PAYMENT SCREENSHOT UPLOAD & LOCK/UNLOCK VALIDATION
    // ==========================================================================
    
    // File Selection Event
    screenshotInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });

    // Drag and Drop Events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    });

    function handleFile(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file (JPG, PNG, WEBP)', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showToast('File size is too large. Please select an image under 10MB', 'error');
            return;
        }

        screenshotFileName = file.name;
        previewFilename.innerText = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            screenshotBase64 = e.target.result;
            imagePreview.src = screenshotBase64;
            
            // Show preview, hide placeholder
            uploadPlaceholder.classList.add('hidden');
            previewWrapper.classList.remove('hidden');
            uploadError.style.display = 'none';

            // Unlock Form Submit Button
            unlockSubmitButton();
            showToast('Payment screenshot attached successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }

    // Remove Attached Screenshot
    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        screenshotBase64 = null;
        screenshotFileName = null;
        screenshotInput.value = '';
        imagePreview.src = '';
        
        // Reset UI to placeholder & lock submit button
        uploadPlaceholder.classList.remove('hidden');
        previewWrapper.classList.add('hidden');
        lockSubmitButton();
    });

    function unlockSubmitButton() {
        submitBtn.disabled = false;
        lockStatusBanner.className = 'upload-status-banner unlocked';
        lockStatusBanner.innerHTML = '<i class="fa-solid fa-lock-open"></i> <span>Payment screenshot attached. Ready to submit!</span>';
    }

    function lockSubmitButton() {
        submitBtn.disabled = true;
        lockStatusBanner.className = 'upload-status-banner locked';
        lockStatusBanner.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Upload Rs. 100 payment screenshot.</span>';
    }

    // ==========================================================================
    // 4. FORM FIELD VALIDATION
    // ==========================================================================
    function validateForm() {
        let isValid = true;

        // Reset errors
        document.querySelectorAll('.input-group').forEach(group => group.classList.remove('invalid'));
        uploadError.style.display = 'none';

        // Full Name
        if (!fullNameInput.value.trim()) {
            markInvalid(fullNameInput);
            isValid = false;
        }

        // School Name
        if (!schoolNameInput.value.trim()) {
            markInvalid(schoolNameInput);
            isValid = false;
        }

        // Class
        if (!classNameInput.value) {
            markInvalid(classNameInput);
            isValid = false;
        }

        // Section
        if (!sectionInput.value.trim()) {
            markInvalid(sectionInput);
            isValid = false;
        }

        // Phone Number (10 digits starting with 6-9)
        const phoneVal = phoneInput.value.trim();
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneVal)) {
            const phoneGroup = phoneInput.closest('.input-group');
            phoneGroup.classList.add('invalid');
            isValid = false;
        }

        // Mandatory Screenshot Check
        if (!screenshotBase64) {
            uploadError.style.display = 'block';
            isValid = false;
        }

        return isValid;
    }

    function markInvalid(inputEl) {
        const group = inputEl.closest('.input-group');
        if (group) group.classList.add('invalid');
    }

    // Allow only numeric input for phone
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // ==========================================================================
    // 5. FORM SUBMISSION & GOOGLE SHEETS POST
    // ==========================================================================
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Please fill all required fields and attach payment screenshot.', 'error');
            return;
        }

        // Prepare Submission Data Payload
        const payload = {
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            event: 'ISKCON Tirupati Sri Krishna Janmashtami SHYAMA 2026',
            fullName: fullNameInput.value.trim(),
            schoolName: schoolNameInput.value.trim(),
            className: classNameInput.value,
            section: sectionInput.value.trim().toUpperCase(),
            phone: phoneInput.value.trim(),
            fee: '100',
            screenshotBase64: screenshotBase64,
            fileName: screenshotFileName
        };

        // Show Processing Loading State
        setSubmittingState(true);

        try {
            if (appsScriptUrl && appsScriptUrl.trim() !== '') {
                // Submit Payload to Google Apps Script Web App
                await fetch(appsScriptUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                showSuccessModal(payload);
                resetForm();
            } else {
                // Demonstration / Fallback Mode if Apps Script URL is not set yet
                setTimeout(() => {
                    showSuccessModal(payload);
                    showToast('Submitted in Preview Mode! (Tip: Set Google Sheet Web App URL in header)', 'info');
                    resetForm();
                }, 1000);
            }
        } catch (err) {
            console.error('Submission error:', err);
            showToast('Error submitting data. Please check connection or Apps Script URL.', 'error');
        } finally {
            setSubmittingState(false);
        }
    });

    function setSubmittingState(isSubmitting) {
        if (isSubmitting) {
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        } else {
            submitBtn.disabled = !screenshotBase64;
            submitBtn.querySelector('.btn-text').classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    }

    function showSuccessModal(data) {
        sumName.innerText = data.fullName;
        sumSchool.innerText = data.schoolName;
        sumClassSection.innerText = `${data.className} (Sec: ${data.section})`;
        sumPhone.innerText = '+91 ' + data.phone;

        successModal.classList.remove('hidden');
    }

    closeSuccessBtn.addEventListener('click', () => {
        successModal.classList.add('hidden');
    });

    function resetForm() {
        paymentForm.reset();
        screenshotBase64 = null;
        screenshotFileName = null;
        uploadPlaceholder.classList.remove('hidden');
        previewWrapper.classList.add('hidden');
        imagePreview.src = '';
        lockSubmitButton();
    }

    // ==========================================================================
    // 6. TOAST NOTIFICATION SYSTEM
    // ==========================================================================
    function showToast(message, type = 'info') {
        toastMsg.innerText = message;
        toast.className = 'toast';
        
        if (type === 'success') {
            toast.style.borderColor = 'var(--color-success)';
        } else if (type === 'error') {
            toast.style.borderColor = 'var(--color-danger)';
        } else {
            toast.style.borderColor = 'var(--color-gold)';
        }

        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }
});

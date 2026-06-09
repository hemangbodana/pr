// ========================================
// DONATION PAGE WITH RAZORPAY INTEGRATION
// ========================================

const API_URL = 'http://localhost:5000/api';

// Donation Type Toggle
const toggleBtns = document.querySelectorAll('.toggle-btn');
let donationType = 'one-time';

toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        donationType = btn.dataset.type;
    });
});

// Amount Button Selection
const amountBtns = document.querySelectorAll('.amount-btn');
const customAmountInput = document.getElementById('customAmount');

amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        amountBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const amount = btn.dataset.amount;
        if (amount === 'custom') {
            customAmountInput.value = '';
            customAmountInput.focus();
        } else {
            customAmountInput.value = amount;
            updateImpact(parseInt(amount));
        }
    });
});

// Custom Amount Input
customAmountInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value > 0) {
        amountBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.amount-btn[data-amount="custom"]').classList.add('active');
        updateImpact(value);
    }
});

// Impact Calculator
function updateImpact(amount) {
    const impactText = document.getElementById('impactText');

    if (amount >= 10000) {
        const animals = Math.floor(amount / 10000);
        impactText.innerHTML = `You can provide <strong>full month care for ${animals} animal${animals > 1 ? 's' : ''}</strong>! 🎉`;
    } else if (amount >= 5000) {
        const surgeries = Math.floor(amount / 5000);
        impactText.innerHTML = `You can fund <strong>${surgeries} emergency surger${surgeries > 1 ? 'ies' : 'y'}</strong>! 🏥`;
    } else if (amount >= 2500) {
        const vaccinations = Math.floor(amount / 2500) * 10;
        impactText.innerHTML = `You can provide <strong>vaccinations for ${vaccinations} animals</strong>! 💉`;
    } else if (amount >= 1000) {
        const checkups = Math.floor(amount / 1000);
        impactText.innerHTML = `You can provide <strong>${checkups} medical checkup${checkups > 1 ? 's' : ''}</strong>! 🩺`;
    } else if (amount >= 500) {
        const days = Math.floor(amount / 500);
        impactText.innerHTML = `You can provide <strong>food for 5 animals for ${days} day${days > 1 ? 's' : ''}</strong>! 🍲`;
    } else if (amount >= 100) {
        impactText.innerHTML = `Every rupee helps! You can contribute to <strong>daily animal care</strong>! ❤️`;
    } else {
        impactText.textContent = 'Enter an amount to see your impact';
    }
}

// Cause Selection Updates
const causeSelect = document.getElementById('cause');
const causeTitle = document.getElementById('causeTitle');
const causeDescription = document.getElementById('causeDescription');

const causeInfo = {
    'general': {
        title: 'General Fund - Where Needed Most',
        description: 'Your donation will be used where it\'s needed most - from emergency rescues to daily care, medical treatments to shelter maintenance. Every rupee makes a difference.'
    },
    'cow-rescue': {
        title: 'Cow Rescue & Rehabilitation',
        description: 'Help us rescue abandoned and injured cows from streets and slaughterhouses. Your donation provides lifetime shelter, nutritious food, and medical care at our gaushalas.'
    },
    'dog-shelter': {
        title: 'Dog Shelter & Care',
        description: 'Support our dog shelters providing safe haven, medical care, and adoption services for street dogs. Your donation ensures proper nutrition, vaccination, and love for every dog.'
    },
    'medical': {
        title: 'Medical Treatment Fund',
        description: 'Fund critical medical treatments and surgeries for rescued animals. Your donation provides expert veterinary care, medicines, and post-operative recovery support.'
    },
    'winter': {
        title: 'Winter Shelter Drive 2026',
        description: 'Help us provide warm shelter, blankets, and extra nutrition for 500+ street animals during harsh winter months. Every donation brings warmth and safety.'
    },
    'emergency': {
        title: 'Emergency Response',
        description: 'Support our 24/7 emergency rescue team. Your donation helps us respond quickly to accidents, abuse cases, and natural disasters affecting animals.'
    },
    'shelter-construction': {
        title: 'New Shelter Construction',
        description: 'Help us build a new 5000 sq ft shelter facility in Rajasthan to house 200 more rescued animals. Your donation builds hope and homes for the voiceless.'
    }
};

causeSelect.addEventListener('change', (e) => {
    const cause = e.target.value;
    if (causeInfo[cause]) {
        causeTitle.textContent = causeInfo[cause].title;
        causeDescription.textContent = causeInfo[cause].description;
    }
});

// Form Submission with Razorpay Integration
const donationForm = document.getElementById('donationForm');

donationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const amount = customAmountInput.value;
    const cause = causeSelect.value;
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const pan = document.getElementById('pan').value;
    const message = document.getElementById('message').value;

    // Validate
    if (!amount || amount < 10) {
        alert('❌ Minimum donation amount is ₹10');
        return;
    }

    if (!cause) {
        alert('❌ Please select a cause');
        causeSelect.focus();
        return;
    }

    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Initializing Secure Payment...';
    submitBtn.disabled = true;

    try {
        // 1. Create Order on Backend
        const response = await fetch(`${API_URL}/donations/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: parseFloat(amount),
                donorInfo: {
                    fullName,
                    email,
                    phone,
                    pan
                },
                cause: cause,
                projectId: null // Could be mapped from cause
            })
        });

        const data = await response.json();

        if (!response.ok) {
            let errorMsg = data.message || 'Failed to initialize order';
            if (data.message === 'Authentication failed') {
                errorMsg = '❌ Razorpay Authentication Failed: Please check if the RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correctly set in the backend .env file.';
            }
            throw new Error(errorMsg);
        }

        const { order } = data;

        // 2. Open Razorpay Checkout
        const options = {
            key: 'rzp_test_your_id', // This should ideally be fetched from backend or injected
            amount: order.amount,
            currency: order.currency,
            name: 'Babyraj Foundation',
            description: `Donation for ${causeInfo[cause].title}`,
            image: '/images/logo.png',
            order_id: order.id,
            handler: async function (response) {
                // 3. Verify Payment on Backend
                submitBtn.textContent = 'Verifying Payment...';
                try {
                    const verifyRes = await fetch(`${API_URL}/donations/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(response)
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.success) {
                        alert('🎉 Thank you! Payment successful. You can download your receipt now.');
                        window.location.href = '/success.html'; // Or show a success message
                    } else {
                        alert('❌ Payment verification failed: ' + verifyData.message);
                    }
                } catch (err) {
                    alert('❌ Verification error. Please contact support.');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            },
            prefill: {
                name: fullName,
                email: email,
                contact: phone
            },
            theme: {
                color: '#16a34a'
            },
            modal: {
                ondismiss: function() {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error('Error:', error);
        alert(`❌ Error: ${error.message}`);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check URL for campaign parameter
    const urlParams = new URLSearchParams(window.location.search);
    const campaign = urlParams.get('campaign');

    if (campaign) {
        const campaignMap = {
            'winter': 'winter',
            'medical': 'medical',
            'shelter': 'shelter-construction'
        };

        if (campaignMap[campaign]) {
            causeSelect.value = campaignMap[campaign];
            causeSelect.dispatchEvent(new Event('change'));
        }
    }
});

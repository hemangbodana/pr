// ========================================
// GLOBAL VARIABLES
// ========================================
let currentSlide = 0;
let slideInterval;

// ========================================
// HEADER SCROLL EFFECT
// ========================================
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ========================================
// MOBILE MENU TOGGLE
// ========================================
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const nav = document.getElementById('nav');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            nav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
}

// ========================================
// HERO SLIDER
// ========================================
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.querySelector('.hero-dots');
    const prevBtn = document.querySelector('.hero-prev');
    const nextBtn = document.querySelector('.hero-next');

    if (!slides.length) return;

    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('hero-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    function updateSlider() {
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });
        
        const dots = document.querySelectorAll('.hero-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlider();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
        resetInterval();
    }

    function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        resetInterval();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        resetInterval();
    });

    // Auto-play
    slideInterval = setInterval(nextSlide, 5000);
}

// Add CSS for dots dynamically
const dotStyles = `
.hero-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
}
.hero-dot.active {
    background: #FFFFFF;
    width: 32px;
    border-radius: 6px;
}
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = dotStyles;
document.head.appendChild(styleSheet);

// ========================================
// IMPACT COUNTER ANIMATION
// ========================================
function animateCounters() {
    const counters = document.querySelectorAll('.impact-number');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;

                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };

                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

// ========================================
// STORY SLIDER (Before/After)
// ========================================
function initStorySliders() {
    const storyCards = document.querySelectorAll('.story-card');

    storyCards.forEach(card => {
        const toggle = card.querySelector('.story-toggle');
        const images = card.querySelectorAll('.story-image');
        const labels = card.querySelectorAll('.story-label');
        let isAfter = false;

        if (toggle) {
            toggle.addEventListener('click', () => {
                isAfter = !isAfter;
                
                images.forEach((img, index) => {
                    img.classList.toggle('active', index === (isAfter ? 1 : 0));
                });
                
                labels.forEach((label, index) => {
                    label.classList.toggle('active', index === (isAfter ? 1 : 0));
                });

                toggle.textContent = isAfter ? '← See Before' : 'See After →';
            });
        }
    });
}

// ========================================
// NEWSLETTER FORM
// ========================================
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            
            // Show success message (in real app, send to backend)
            alert(`Thank you for subscribing! We'll send updates to ${email}`);
            form.reset();
        });
    }
}

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ========================================
// LAZY LOADING IMAGES
// ========================================
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// ========================================
// GALLERY LIGHTBOX
// ========================================
function initGalleryLightbox() {
    // If the page has its own custom lightbox implementation, skip this
    if (document.getElementById('customLightbox')) return;

    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            let imgSrc = '';
            let imgAlt = '';
            
            if (item.tagName.toLowerCase() === 'img') {
                imgSrc = item.src;
                imgAlt = item.alt || '';
            } else {
                const img = item.querySelector('img');
                if (!img) return;
                imgSrc = img.src;
                imgAlt = img.alt || '';
            }

            // Create lightbox
            const lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `
                <div class="lightbox-content">
                    <img src="${imgSrc}" alt="${imgAlt}">
                    <button class="lightbox-close">✕</button>
                </div>
            `;
            
            document.body.appendChild(lightbox);
            document.body.style.overflow = 'hidden';
            
            // Close lightbox
            const closeBtn = lightbox.querySelector('.lightbox-close');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(lightbox);
                document.body.style.overflow = '';
            });
            
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    document.body.removeChild(lightbox);
                    document.body.style.overflow = '';
                }
            });
        });
    });
}

// Add lightbox styles
const lightboxStyles = `
.lightbox {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
}

.lightbox-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
}

.lightbox-content img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 12px;
}

.lightbox-close {
    position: absolute;
    top: -50px;
    right: 0;
    background: #FF6B35;
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.lightbox-close:hover {
    transform: scale(1.1);
    background: #FF8C61;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;

const lightboxStyleSheet = document.createElement('style');
lightboxStyleSheet.textContent = lightboxStyles;
document.head.appendChild(lightboxStyleSheet);

// ========================================
// DONATION REDIRECT
// ========================================
document.querySelectorAll('.btn-donate-header, .btn-primary[href="donate.html"]').forEach(btn => {
    if (!btn.getAttribute('href')) {
        btn.addEventListener('click', () => {
            window.location.href = 'donate.html';
        });
    }
});

// ========================================
// INITIALIZE ALL FUNCTIONS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    animateCounters();
    initStorySliders();
    initNewsletterForm();
    initLazyLoading();
    initGalleryLightbox();
});

// ========================================
// PAGE VISIBILITY API (Pause slider when tab is hidden)
// ========================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(slideInterval);
    } else {
        slideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % document.querySelectorAll('.hero-slide').length;
            document.querySelectorAll('.hero-slide').forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlide);
            });
        }, 5000);
    }
});

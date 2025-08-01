// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('HTML + JS + CSS Template loaded successfully!');
    // Initialize all functionality
    initializeNavigation();
    initializeScrollAnimations();

});





    const closeAuthModal = document.getElementById('closeAuthModal');
    const authForm = document.getElementById('authForm');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const authTitle = document.getElementById('authTitle');
    let isLoginMode = true;


    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            firebase.auth().signOut();
        });
    }
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', closeModal);
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', openModal);
    }
    if (toggleAuthMode) {
        toggleAuthMode.addEventListener('click', function() {
            isLoginMode = !isLoginMode;
            authTitle.textContent = isLoginMode ? 'Login' : 'Sign Up';
            authForm.querySelector('button[type="submit"]').textContent = isLoginMode ? 'Login' : 'Sign Up';
            toggleAuthMode.textContent = isLoginMode ? 'Create an account' : 'Already have an account? Login';
        });
    }
    if (authForm) {
        authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            if (isLoginMode) {
                firebase.auth().signInWithEmailAndPassword(email, password)
                    .then(() => { closeModal(); })
                    .catch(err => alert(err.message));
            } else {
                firebase.auth().createUserWithEmailAndPassword(email, password)
                    .then(() => { closeModal(); })
                    .catch(err => alert(err.message));
            }
        });
    }
    // Google Auth
    const googleAuthBtn = document.getElementById('googleAuthBtn');
    if (googleAuthBtn) {
        googleAuthBtn.addEventListener('click', function() {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then(() => { closeModal(); })
                .catch(err => alert(err.message));
        });
    }
    // Show/hide login/logout buttons based on auth state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    });
}




// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Smooth scroll to section
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active nav link
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}



// Field validation
function validateField(field) {
    const value = field.value.trim();
    
    // Remove existing error styling
    field.classList.remove('error');
    
    if (!value) {
        field.classList.add('error');
        return false;
    }
    
    if (field.type === 'email' && !isValidEmail(value)) {
        field.classList.add('error');
        return false;
    }
    
    return true;
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '5px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // Set background color based on type
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        observer.observe(card);
    });
    
    // Add CSS for scroll animations
    addScrollAnimationStyles();
}

// Add scroll animation styles dynamically
function addScrollAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .feature-card {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .feature-card.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .form-group input.error,
        .form-group textarea.error {
            border-color: #e74c3c;
            box-shadow: 0 0 5px rgba(231, 76, 60, 0.3);
        }
    `;
    document.head.appendChild(style);
}

// Utility functions
const utils = {
    // Debounce function for performance
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
        );
    }
};

// Export utils for global access (optional)
window.templateUtils = utils;

// Debug-Tool für DevTools: Button-Stack-Analyse
window.debugButtonStack = function() {
  const btn = document.getElementById('loginBtn');
  const rect = btn.getBoundingClientRect();
  const cx = Math.floor(rect.left + rect.width/2);
  const cy = Math.floor(rect.top + rect.height/2);
  const topEl = document.elementFromPoint(cx, cy);
  console.log('Topmost element:', topEl);
  const stack = document.elementsFromPoint(cx, cy).map(e => {
    const cs = getComputedStyle(e);
    return {
      tag: e.tagName.toLowerCase(),
      class: e.className,
      id: e.id,
      zIndex: cs.zIndex,
      position: cs.position,
      pointerEvents: cs.pointerEvents,
      opacity: cs.opacity,
    };
  });
  console.table(stack);
  const chain = document.elementsFromPoint(cx, cy);
  console.log('Pointer-events chain:', chain.map(e => [e.tagName, e.className, getComputedStyle(e).pointerEvents]));
  function stackingContexts(node){
    const out = [];
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      const createsContext =
        cs.position !== 'static' && cs.zIndex !== 'auto' ||
        cs.transform !== 'none' ||
        cs.filter !== 'none' ||
        parseFloat(cs.opacity) < 1 ||
        cs.mixBlendMode !== 'normal' ||
        cs.perspective !== 'none' ||
        cs.isolation === 'isolate' ||
        cs.willChange && /transform|opacity|filter|perspective/.test(cs.willChange);
      if (createsContext) {
        out.push({node, class: node.className, z: cs.zIndex, pos: cs.position, transform: cs.transform, opacity: cs.opacity});
      }
      node = node.parentElement;
    }
    return out;
  }
  console.log('Stacking Contexts:', stackingContexts(topEl || btn));
};

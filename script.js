// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('HTML + JS + CSS Template loaded successfully!');
    // Initialize all functionality
    initializeNavigation();
    initializeScrollAnimations();

});

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

/* ============================================
   AI CODING ACADEMY - MAIN JAVASCRIPT
============================================ */

// Scroll reveal animation
function reveal() {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('active');
        }
    });
}

window.addEventListener('scroll', reveal);
window.addEventListener('load', reveal);

// Nav scroll effect
const nav = document.querySelector('.nav');
if (nav) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
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

// Search functionality (keyboard shortcut + Enter to search)
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.nav-search input');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

const navSearchInput = document.querySelector('.nav-search input');
if (navSearchInput) {
    navSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            // If already on the tutorials page, let the inline script handle in-place filtering
            if (window.location.pathname.includes('/tutorials/index')) return;
            const query = navSearchInput.value.trim();
            // Find the tutorials nav link to get the correct relative path
            const tutorialsLink = document.querySelector('a[href*="tutorials/index.html"]');
            const base = tutorialsLink ? tutorialsLink.href : 'tutorials/index.html';
            const tutorialsUrl = new URL(base);
            if (query) {
                tutorialsUrl.searchParams.set('q', query);
            }
            window.location.href = tutorialsUrl.toString();
        }
    });
}

// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuBtn.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
    });
}

// Copy code functionality
function copyCode(button) {
    const codeBlock = button.closest('.code-window').querySelector('.code-content');
    const text = codeBlock.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.color = 'var(--accent-success)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.color = '';
        }, 2000);
    });
}

// Tab switching
document.querySelectorAll('.tabs').forEach(tabContainer => {
    const tabs = tabContainer.querySelectorAll('.tab');
    const contents = tabContainer.closest('.tab-container')?.querySelectorAll('.tab-content');
    
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (contents) {
                contents.forEach(c => c.classList.remove('active'));
                contents[index]?.classList.add('active');
            }
        });
    });
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const filterGroup = btn.closest('.filter-group') || btn.parentElement;
        filterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Trigger filter event
        const filterValue = btn.dataset.filter;
        const event = new CustomEvent('filter', { detail: { filter: filterValue } });
        document.dispatchEvent(event);
    });
});

// Accordion functionality
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.closest('.accordion-item');
        const isOpen = item.classList.contains('open');
        
        // Close all items in this accordion
        const accordion = item.closest('.accordion');
        accordion.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
        
        // Open clicked item if it wasn't open
        if (!isOpen) {
            item.classList.add('open');
        }
    });
});

// Progress animation on scroll
const progressBars = document.querySelectorAll('.progress-bar');
const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const progress = bar.dataset.progress || 0;
            bar.style.width = progress + '%';
        }
    });
}, { threshold: 0.5 });

progressBars.forEach(bar => progressObserver.observe(bar));

// Tooltip functionality
document.querySelectorAll('[data-tooltip]').forEach(element => {
    element.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = element.dataset.tooltip;
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        tooltip.style.left = rect.left + (rect.width - tooltip.offsetWidth) / 2 + 'px';
    });
    
    element.addEventListener('mouseleave', () => {
        document.querySelectorAll('.tooltip').forEach(t => t.remove());
    });
});

// Search functionality
const searchInputs = document.querySelectorAll('.search-input');
searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const searchableItems = document.querySelectorAll('[data-searchable]');
        
        searchableItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = text.includes(query);
            item.style.display = matches ? '' : 'none';
        });
    });
});

// Lazy loading images
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));

// Tutorial completion tracking (localStorage)
const TutorialProgress = {
    getProgress: () => {
        return JSON.parse(localStorage.getItem('tutorialProgress') || '{}');
    },
    
    markComplete: (tutorialId) => {
        const progress = TutorialProgress.getProgress();
        progress[tutorialId] = { completed: true, date: new Date().toISOString() };
        localStorage.setItem('tutorialProgress', JSON.stringify(progress));
    },
    
    isComplete: (tutorialId) => {
        const progress = TutorialProgress.getProgress();
        return progress[tutorialId]?.completed || false;
    },
    
    getCompletedCount: () => {
        const progress = TutorialProgress.getProgress();
        return Object.values(progress).filter(p => p.completed).length;
    }
};

// Expose to global scope
window.TutorialProgress = TutorialProgress;
window.copyCode = copyCode;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    reveal();
    
    // Update any progress displays
    const progressCounters = document.querySelectorAll('[data-progress-count]');
    progressCounters.forEach(counter => {
        counter.textContent = TutorialProgress.getCompletedCount();
    });
});

console.log('🚀 AI Coding Academy loaded successfully!');

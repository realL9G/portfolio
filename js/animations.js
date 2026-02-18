document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
            }
        });
    }, observerOptions);
    
    const animatedElements = document.querySelectorAll('[data-animation]');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    function staggerAnimation(container, itemSelector, delay = 100) {
        const items = container.querySelectorAll(itemSelector);
        
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * delay}ms`;
        });
    }

    const servicesGrid = document.querySelector('.services-grid');
    if (servicesGrid) {
        staggerAnimation(servicesGrid, '.service-card', 100);
    }

    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (portfolioGrid) {
        staggerAnimation(portfolioGrid, '.portfolio-card', 150);
    }
    
    const testimonialsGrid = document.querySelector('.testimonials-grid');
    if (testimonialsGrid) {
        staggerAnimation(testimonialsGrid, '.testimonial-card', 120);
    }
    
    function typeWriter(element, text, speed = 50) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }

    function addTiltEffect(cards) {
        cards.forEach(card => {
            card.addEventListener('mousemove', function(e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });
            
            card.addEventListener('mouseleave', function() {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            });
        });
    }
    
    const serviceCards = document.querySelectorAll('.service-card');
    addTiltEffect(serviceCards);

    function addPulseAnimation() {
        const statusDots = document.querySelectorAll('.status-dot, .status-dot-green');
        
        statusDots.forEach(dot => {
            dot.style.animation = 'pulse 2s infinite';
        });
    }
    
    addPulseAnimation();

    function addMagneticEffect(buttons) {
        buttons.forEach(button => {
            button.addEventListener('mousemove', function(e) {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });
            
            button.addEventListener('mouseleave', function() {
                button.style.transform = 'translate(0, 0)';
            });
        });
    }
    
    const primaryButtons = document.querySelectorAll('.btn-primary');
    addMagneticEffect(primaryButtons);

    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    const sections = document.querySelectorAll('section');
    
    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        sectionObserver.observe(section);
    });
    

    window.addEventListener('load', function() {
        const loader = document.createElement('div');
        loader.className = 'loading';
        loader.innerHTML = '<div class="loading-spinner"></div>';

        setTimeout(function() {
            loader.classList.add('hidden');
            setTimeout(function() {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 500);
        }, 1000);
    });
});
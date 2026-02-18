document.addEventListener('DOMContentLoaded', function() {
    // ==================================
    // ANIMATED PAGE TITLE
    // ==================================
    const baseTitle = 'l9g - $';
        const fullTitle = 'l9g - $Portfolio';
        let isExpanding = true;
        let currentLength = baseTitle.length;
        
        function animateTitle() {
            if (isExpanding) {
                if (currentLength < fullTitle.length) {
                    currentLength++;
                    document.title = fullTitle.substring(0, currentLength);
                } else {
                    isExpanding = false;
                    setTimeout(animateTitle, 1500); // Pause at full title
                    return;
                }
            } else {
                if (currentLength > baseTitle.length) {
                    currentLength--;
                    document.title = fullTitle.substring(0, currentLength);
                } else {
                    isExpanding = true;
                    setTimeout(animateTitle, 1000); // Pause at short title
                    return;
                }
            }
            
            setTimeout(animateTitle, 200); // Typing speed
        }
        
        animateTitle();
    
    // ==================================
    // 1. ACTIVE NAV LINK ON SCROLL
    // ==================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function updateActiveLink() {
        let current = '';
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Initial call
    
    // ==================================
    // 2. COUNTER ANIMATION
    // ==================================
    const counters = document.querySelectorAll('.stat-number');
    let hasAnimated = false;
    
    function animateCounters() {
        if (hasAnimated) return;
        
        const statsSection = document.querySelector('.stats');
        if (!statsSection) return;
        
        const statsPosition = statsSection.getBoundingClientRect().top;
        const screenPosition = window.innerHeight;
        
        if (statsPosition < screenPosition) {
            hasAnimated = true;
            
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60fps
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
            });
        }
    }
    
    window.addEventListener('scroll', animateCounters);
    animateCounters(); // Initial check
    
    // ==================================
    // 3. SCROLL TO TOP BUTTON
    // ==================================
    const scrollTopBtn = document.querySelector('.scroll-to-top');
    
    if (scrollTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // ==================================
    // 5. MOBILE MENU TOGGLE
    // ==================================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // ==================================
    // 6. TRAFFIC LIGHTS (cosmetic)
    // ==================================
    const trafficLights = document.querySelectorAll('.traffic-light');
    trafficLights.forEach(light => {
        light.addEventListener('click', function() {
            if (this.classList.contains('close')) {
                alert('Nice try! 😄');
            }
        });
    });
});

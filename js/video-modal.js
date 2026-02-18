document.addEventListener('DOMContentLoaded', function() {
    
    const videoCards = document.querySelectorAll('.portfolio-card.video-card');

    if (!document.getElementById('videoModal')) {
        const videoModalHTML = `
            <div class="video-modal" id="videoModal">
                <div class="video-modal-window">
                    <div class="modal-header">
                        <div class="modal-traffic-lights">
                            <div class="modal-traffic-light close" id="modalClose"></div>
                            <div class="modal-traffic-light minimize"></div>
                            <div class="modal-traffic-light maximize"></div>
                        </div>
                        <div class="modal-title" id="modalTitle">Video Player</div>
                        <div class="modal-esc-hint">[ESC] to close</div>
                    </div>
                    <div class="modal-content">
                        <div class="modal-video-container" id="modalVideoContainer">
                            <!-- Video iframe will be injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', videoModalHTML);
    }
    
    const modal = document.getElementById('videoModal');
    const modalClose = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalVideoContainer = document.getElementById('modalVideoContainer');
    
    videoCards.forEach(card => {
        card.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            const videoTitle = this.getAttribute('data-video-title');
            
            if (videoId) {
                openVideoModal(videoId, videoTitle);
            }
        });
    });
    
    function openVideoModal(videoId, title) {
        modalTitle.textContent = title || 'Video Player';
   
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        
        modalVideoContainer.innerHTML = '';
        modalVideoContainer.appendChild(iframe);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeVideoModal() {
        modal.classList.remove('active');
        modalVideoContainer.innerHTML = '';
        document.body.style.overflow = '';
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeVideoModal);
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeVideoModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeVideoModal();
        }
    });

    const maximizeBtn = modal.querySelector('.modal-traffic-light.maximize');
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', function() {
            const modalWindow = modal.querySelector('.video-modal-window');
            if (modalWindow.style.maxWidth === '98vw') {
                modalWindow.style.maxWidth = '90vw';
                modalWindow.style.maxHeight = '90vh';
            } else {
                modalWindow.style.maxWidth = '98vw';
                modalWindow.style.maxHeight = '98vh';
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    
    const imageModalHTML = `
        <div class="image-modal" id="imageModal">
            <div class="image-modal-window">
                <div class="modal-header">
                    <div class="modal-traffic-lights">
                        <div class="modal-traffic-light close" id="imageModalClose"></div>
                        <div class="modal-traffic-light minimize"></div>
                        <div class="modal-traffic-light maximize"></div>
                    </div>
                    <div class="modal-title">Testimonial</div>
                    <div class="modal-esc-hint">[ESC] to close</div>
                </div>
                <div class="image-modal-content" id="imageModalContent">
                    <!-- Image will be injected here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', imageModalHTML);
    
    const modal = document.getElementById('imageModal');
    const modalClose = document.getElementById('imageModalClose');
    const modalContent = document.getElementById('imageModalContent');
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    
    testimonialCards.forEach(card => {
        card.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img) {
                openImageModal(img.src, img.alt);
            }
        });
    });
    
    function openImageModal(imageSrc, imageAlt) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = imageAlt;
        
        img.addEventListener('click', function() {
            this.classList.toggle('zoomed');
        });
        
        modalContent.innerHTML = '';
        modalContent.appendChild(img);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeImageModal() {
        modal.classList.remove('active');
        modalContent.innerHTML = '';
        document.body.style.overflow = '';
    }
    
    modalClose.addEventListener('click', closeImageModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeImageModal();
        }
    });
});

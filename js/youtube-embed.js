// YouTube Embed Handler - Lazy Loading for Performance

document.addEventListener('DOMContentLoaded', function() {

    function lazyLoadVideos() {
        const videoIframes = document.querySelectorAll('iframe[data-src]');
        
        const videoObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    iframe.src = iframe.dataset.src;
                    iframe.removeAttribute('data-src');
                    observer.unobserve(iframe);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        videoIframes.forEach(iframe => {
            videoObserver.observe(iframe);
        });
    }
    
    lazyLoadVideos();
    
    function trackVideoPlay(videoTitle) {
        console.log('Video played:', videoTitle);
    }
    
    const videoContainers = document.querySelectorAll('.video-container');
    videoContainers.forEach(container => {
        container.addEventListener('click', function() {
            const iframe = this.querySelector('iframe');
            if (iframe) {
                const title = iframe.getAttribute('title');
                trackVideoPlay(title);
            }
        });
    });
});

function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function createYouTubeEmbedUrl(videoId, options = {}) {
    const defaults = {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
    };
    
    const params = { ...defaults, ...options };
    const queryString = Object.keys(params)
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    return `https://www.youtube.com/embed/${videoId}?${queryString}`;
}

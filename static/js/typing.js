/**
 * Typing Animation Effect
 * Creates a typewriter effect cycling through professional titles
 */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Configuration
    const CONFIG = {
        phrases: [
            'ML Engineer',
            'AI Developer',
            'Data Scientist',
            'Problem Solver',
            'MLOps Specialist'
        ],
        typeSpeed: 100,      // ms per character when typing
        deleteSpeed: 50,     // ms per character when deleting
        pauseAfterType: 2000, // pause after typing complete phrase
        pauseAfterDelete: 500 // pause after deleting before next phrase
    };

    const textElement = document.getElementById('typing-text');
    if (!textElement) return;

    // If user prefers reduced motion, just show first phrase statically
    if (prefersReducedMotion) {
        textElement.textContent = CONFIG.phrases[0];
        return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentText = '';

    function type() {
        const currentPhrase = CONFIG.phrases[phraseIndex];

        if (isDeleting) {
            // Deleting characters
            currentText = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
        } else {
            // Typing characters
            currentText = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
        }

        textElement.textContent = currentText;

        // Determine next action and timing
        let nextDelay = isDeleting ? CONFIG.deleteSpeed : CONFIG.typeSpeed;

        if (!isDeleting && charIndex === currentPhrase.length) {
            // Finished typing, pause then start deleting
            nextDelay = CONFIG.pauseAfterType;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting, move to next phrase
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % CONFIG.phrases.length;
            nextDelay = CONFIG.pauseAfterDelete;
        }

        setTimeout(type, nextDelay);
    }

    // Start typing animation after a short delay
    setTimeout(type, 500);

})();

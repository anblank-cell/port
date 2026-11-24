/**
 * Public Navbar Component
 * Encapsulates header navigation menu rendering and mobile drawer behavior for public visitors.
 */

window.PublicNavbar = (() => {
    const init = () => {
        const toggle = document.getElementById('hamburger-toggle');
        const menu   = document.getElementById('navigation-menu');

        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
            });
        }
    };

    return {
        init
    };
})();

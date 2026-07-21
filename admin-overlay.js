const focusableSelector = 'input:not([type="hidden"]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"])';

export function openAdminOverlay(overlay) {
    if (!overlay) return;

    overlay.classList.remove('hidden');
    overlay.classList.add('open', 'opened');
    overlay.style.pointerEvents = 'auto';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const focusTarget = overlay.querySelector(focusableSelector);
    if (focusTarget) {
        requestAnimationFrame(() => focusTarget.focus());
    }
}

export function closeAdminOverlay(overlay) {
    if (!overlay) return;

    overlay.classList.remove('open', 'opened');
    overlay.classList.add('hidden');
    overlay.style.pointerEvents = '';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

export function initAdminOverlayCloseButtons(root = document) {
    root.querySelectorAll('[data-admin-overlay-close]').forEach(button => {
        button.addEventListener('click', () => {
            const selector = button.getAttribute('data-admin-overlay-close');
            closeAdminOverlay(document.querySelector(selector));
        });
    });
}

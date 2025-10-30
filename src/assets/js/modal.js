(function () {
  const root = document.getElementById('app-modal-root');
  const dialog = root ? root.querySelector('.modal') : null;
  const titleEl = root ? root.querySelector('#app-modal-title') : null;
  const descEl = root ? root.querySelector('#app-modal-desc') : null;
  const detailsEl = root ? root.querySelector('#app-modal-details') : null;
  const actionsEl = root ? root.querySelector('#app-modal-actions') : null;
  const iconEl = root ? root.querySelector('#app-modal-icon') : null;

  let lastActiveElement = null;
  let focusTrapHandler = null;

  function lockScroll() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function setIcon(type) {
    if (!iconEl) return;
    iconEl.className = 'modal__icon';
    if (type === 'success') {
      iconEl.classList.add('modal__icon', 'modal__icon--success');
      iconEl.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    } else if (type === 'error') {
      iconEl.classList.add('modal__icon', 'modal__icon--error');
      iconEl.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg>';
    } else {
      iconEl.innerHTML = '';
    }
  }

  function clearActions() {
    if (actionsEl) actionsEl.innerHTML = '';
  }

  function createButton({ label, variant = 'primary', onClick, href }) {
    const btn = document.createElement(href ? 'a' : 'button');
    if (href) {
      btn.href = href;
      btn.setAttribute('role', 'button');
    } else {
      btn.type = 'button';
    }
    btn.className = `modal__btn modal__btn--${variant}`;
    btn.textContent = label;
    if (typeof onClick === 'function') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        onClick();
      });
    }
    return btn;
  }

  function trapFocus() {
    const focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
      'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
    ];
    const focusables = dialog.querySelectorAll(focusableSelectors.join(','));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (first && typeof first.focus === 'function') first.focus();

    focusTrapHandler = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', focusTrapHandler);
  }

  function untrapFocus() {
    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
  }

  function openModal(opts) {
    if (!root || !dialog) return;
    const {
      type = 'success',
      title = '',
      message = '',
      details = '',
      actions = []
    } = opts || {};

    lastActiveElement = document.activeElement;

    setIcon(type);
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = message;
    if (detailsEl) {
      if (details) {
        detailsEl.hidden = false;
        detailsEl.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
      } else {
        detailsEl.hidden = true;
        detailsEl.textContent = '';
      }
    }

    clearActions();
    const finalActions = actions && actions.length ? actions : [
      { label: 'Close', variant: 'secondary', onClick: closeModal }
    ];
    finalActions.forEach(cfg => {
      actionsEl.appendChild(createButton(cfg));
    });

    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    lockScroll();
    trapFocus();

    // Close handlers (backdrop or [data-modal-close])
    root.addEventListener('click', backdropHandler, { once: true });
    const closeEls = root.querySelectorAll('[data-modal-close]');
    closeEls.forEach(el => el.addEventListener('click', closeModal, { once: true }));
  }

  function backdropHandler(e) {
    if (e.target && e.target.matches('[data-modal-close]')) return; 
    const withinDialog = e.target.closest('.modal');
    if (!withinDialog) closeModal();
  }

  function closeModal() {
    if (!root) return;
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    untrapFocus();
    unlockScroll();
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  window.openModal = openModal;
  window.closeModal = closeModal;
})();



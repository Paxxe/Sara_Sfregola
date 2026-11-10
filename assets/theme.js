/* Sara Sfregola — Atelier theme */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Header: menu mobile ---------- */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      this.toggle = this.querySelector('[data-menu-toggle]');
      this.panel = this.querySelector('[data-mobile-nav]');
      if (!this.toggle || !this.panel) return;

      this.onToggle = () => this.setOpen(this.toggle.getAttribute('aria-expanded') !== 'true');
      this.onKey = (e) => {
        if (e.key === 'Escape') this.setOpen(false);
      };
      this.onResize = () => {
        if (window.innerWidth >= 1024) this.setOpen(false);
      };

      this.toggle.addEventListener('click', this.onToggle);
      this.panel.addEventListener('click', (e) => {
        if (e.target.closest('a')) this.setOpen(false);
      });
      document.addEventListener('keydown', this.onKey);
      window.addEventListener('resize', this.onResize);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKey);
      window.removeEventListener('resize', this.onResize);
    }

    setOpen(open) {
      this.toggle.setAttribute('aria-expanded', String(open));
      this.toggle.setAttribute('aria-label', open ? this.toggle.dataset.labelClose : this.toggle.dataset.labelOpen);
      const icon = this.toggle.querySelector('[data-menu-icon]');
      if (icon) icon.textContent = open ? '×' : '☰';
      this.panel.hidden = !open;
    }
  }

  /* ---------- Hero: binari di immagini ---------- */
  class HeroScroll extends HTMLElement {
    connectedCallback() {
      this.rails = [...this.querySelectorAll('[data-rail]')];
      this.count = this.rails[0] ? this.rails[0].children.length : 0;
      this.index = 0;
      this.delay = Math.max(3, Number(this.dataset.speed) || 6) * 1000;
      this.visible = true;
      this.counter = this.querySelector('[data-counter]');
      this.progress = this.querySelector('[data-progress]');
      this.motionToggle = this.querySelector('[data-motion-toggle]');

      this.querySelector('[data-prev]')?.addEventListener('click', () => this.go(this.index - 1));
      this.querySelector('[data-next]')?.addEventListener('click', () => this.go(this.index + 1));
      this.motionToggle?.addEventListener('click', () => this.setPlaying(!this.playing));
      this.querySelectorAll('[data-scroll-next]').forEach((link) =>
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const next = this.closest('.shopify-section')?.nextElementSibling;
          (next || document.getElementById('MainContent'))?.scrollIntoView({ behavior: 'smooth' });
        })
      );

      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.schedule();
      });
      this.observer.observe(this);

      this.onVisibility = () => this.schedule();
      document.addEventListener('visibilitychange', this.onVisibility);

      // Theme editor: mostra la slide selezionata
      this.onBlockSelect = (e) => {
        const leftRail = this.rails.find((r) => r.dataset.rail === 'up');
        const i = leftRail ? [...leftRail.children].indexOf(e.target) : -1;
        if (i < 0) return;
        this.editorPaused = true;
        this.go(i);
      };
      this.onBlockDeselect = () => {
        this.editorPaused = false;
        this.schedule();
      };
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      document.addEventListener('shopify:block:deselect', this.onBlockDeselect);

      this.update();
      this.setPlaying(this.dataset.autoplay === 'true' && !reduceMotion.matches && this.count > 1);
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      this.observer?.disconnect();
      document.removeEventListener('visibilitychange', this.onVisibility);
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
      document.removeEventListener('shopify:block:deselect', this.onBlockDeselect);
    }

    go(i) {
      if (!this.count) return;
      this.index = (i + this.count) % this.count;
      this.update();
      this.schedule();
    }

    update() {
      const n = this.count;
      const i = this.index;
      this.rails.forEach((rail) => {
        const pos = rail.dataset.rail === 'down' ? n - 1 - i : i;
        rail.style.transform = `translate3d(0, ${-pos * 100}%, 0)`;
        [...rail.children].forEach((fig, k) => fig.setAttribute('aria-hidden', String(k !== pos)));
      });
      if (this.counter) this.counter.textContent = `${pad(i + 1)} / ${pad(n)}`;
      if (this.progress && n) this.progress.style.transform = `scaleX(${(i + 1) / n})`;
    }

    setPlaying(playing) {
      this.playing = playing;
      if (this.motionToggle) {
        const t = this.motionToggle;
        t.setAttribute('aria-pressed', String(!playing));
        t.setAttribute('aria-label', playing ? t.dataset.labelPause : t.dataset.labelPlay);
        const icon = t.querySelector('[data-motion-icon]');
        if (icon) icon.textContent = playing ? 'Ⅱ' : '▶';
      }
      this.schedule();
    }

    schedule() {
      clearTimeout(this.timer);
      if (!this.playing || this.editorPaused || !this.visible || document.hidden || this.count < 2) return;
      this.timer = setTimeout(() => this.go(this.index + 1), this.delay);
    }
  }

  /* ---------- Creazioni: filtri per categoria ---------- */
  class ProductFilter extends HTMLElement {
    connectedCallback() {
      this.buttons = [...this.querySelectorAll('[data-filter]')];
      this.items = [...this.querySelectorAll('[data-product]')];
      this.empty = this.querySelector('[data-empty]');
      this.buttons.forEach((btn) => btn.addEventListener('click', () => this.apply(btn.dataset.filter)));
    }

    apply(value) {
      this.buttons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.filter === value)));
      let shown = 0;
      this.items.forEach((item) => {
        const tags = (item.dataset.tags || '').split(/\s+/);
        const match = value === 'all' || tags.includes(value);
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (this.empty) this.empty.hidden = shown > 0;
    }
  }

  customElements.get('site-header') || customElements.define('site-header', SiteHeader);
  customElements.get('hero-scroll') || customElements.define('hero-scroll', HeroScroll);
  customElements.get('product-filter') || customElements.define('product-filter', ProductFilter);

  /* ---------- Dialog (consulenza privata) ---------- */
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-dialog-open]');
    if (opener) {
      const dialog = document.getElementById(opener.dataset.dialogOpen);
      if (dialog && !dialog.open) dialog.showModal();
      return;
    }

    const closer = e.target.closest('[data-dialog-close]');
    if (closer) {
      closer.closest('dialog')?.close();
      return;
    }

    // Click sul backdrop
    if (e.target instanceof HTMLDialogElement && e.target.open) {
      const r = e.target.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) e.target.close();
    }
  });

  // Riapre il modale dopo l'invio del modulo (successo o errori)
  const openDialogsWithStatus = (root = document) => {
    root.querySelectorAll('dialog').forEach((dialog) => {
      if (dialog.querySelector('[data-form-status]') && !dialog.open && !window.Shopify?.designMode) {
        dialog.showModal();
      }
    });
  };
  openDialogsWithStatus();
})();

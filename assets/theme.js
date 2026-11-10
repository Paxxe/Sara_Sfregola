/* Sara Sfregola — Atelier theme */
(() => {
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ---------- Header: menu mobile ---------- */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      this.toggle = this.querySelector('[data-menu-toggle]');
      this.nav = this.querySelector('[data-nav]');
      if (!this.toggle || !this.nav) return;

      this.toggle.addEventListener('click', () => this.setOpen(!this.nav.hasAttribute('data-open')));
      this.nav.addEventListener('click', (e) => {
        if (e.target.closest('a')) this.setOpen(false);
      });
      this.onKey = (e) => {
        if (e.key === 'Escape') this.setOpen(false);
      };
      document.addEventListener('keydown', this.onKey);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKey);
    }

    setOpen(open) {
      this.nav.toggleAttribute('data-open', open);
      this.toggle.setAttribute('aria-expanded', String(open));
      this.toggle.setAttribute('aria-label', open ? this.toggle.dataset.labelClose : this.toggle.dataset.labelOpen);
    }
  }

  /* ---------- Hero: binari orizzontali guidati dallo scroll ----------
     Porting di home-presentation.js, generalizzato a N slide:
     - p = avanzamento dello scroll dentro la sezione (0 → 1)
     - binario sinistro:  translateX(-(N-1) * 100% * p)
     - binario destro:    translateX(-(N-1) * 100% * (1 - p))  → senso opposto
     - con "movimento disattivato" p scatta alla slide intera più vicina          */
  class HeroScroll extends HTMLElement {
    connectedCallback() {
      this.stage = this.querySelector('[data-stage]');
      this.left = this.querySelector('[data-rail="left"]');
      this.right = this.querySelector('[data-rail="right"]');
      this.counter = this.querySelector('[data-counter]');
      this.progress = this.querySelector('[data-progress]');
      this.motionToggle = this.querySelector('[data-motion-toggle]');
      this.count = this.left ? this.left.children.length : 0;
      this.steps = Math.max(1, this.count - 1);
      this.slide = 0;
      this.motionOff = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.scheduled = false;

      this.querySelector('[data-next]')?.addEventListener('click', () => this.change(1));
      this.querySelector('[data-prev]')?.addEventListener('click', () => this.change(-1));
      this.motionToggle?.addEventListener('click', () => {
        this.motionOff = !this.motionOff;
        this.syncToggle();
        this.update();
      });
      this.querySelectorAll('[data-scroll-next]').forEach((link) =>
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const next = this.closest('.shopify-section')?.nextElementSibling;
          next?.scrollIntoView({ behavior: this.motionOff ? 'instant' : 'smooth' });
        })
      );

      this.onScroll = () => {
        if (this.scheduled) return;
        this.scheduled = true;
        requestAnimationFrame(() => this.update());
      };
      this.onResize = () => this.update();
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize);

      // Theme editor: selezionando una slide la pagina scorre fino a quella posizione
      this.onBlockSelect = (e) => {
        const i = this.left ? [...this.left.children].indexOf(e.target) : -1;
        if (i >= 0) this.goTo(i, 'instant');
      };
      document.addEventListener('shopify:block:select', this.onBlockSelect);

      this.syncToggle();
      this.update();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
    }

    range() {
      return Math.max(1, this.offsetHeight - this.stage.offsetHeight);
    }

    update() {
      this.scheduled = false;
      if (!this.count) return;
      const p = clamp(-this.getBoundingClientRect().top / this.range(), 0, 1);
      const v = this.motionOff ? Math.round(p * this.steps) / this.steps : p;
      const shift = -100 * (this.count - 1);

      this.slide = Math.round(p * this.steps);
      this.left.style.transform = `translate3d(${shift * v}%,0,0)`;
      this.right.style.transform = `translate3d(${shift * (1 - v)}%,0,0)`;
      if (this.counter) this.counter.textContent = `${pad(this.slide + 1)} / ${pad(this.count)}`;
      if (this.progress) this.progress.style.width = `${p * 100}%`;
    }

    goTo(i, behavior) {
      const top = window.scrollY + this.getBoundingClientRect().top;
      const target = clamp(i, 0, this.steps);
      window.scrollTo({
        top: top + (this.range() * target) / this.steps,
        behavior: behavior || (this.motionOff ? 'instant' : 'smooth'),
      });
    }

    change(delta) {
      this.goTo(this.slide + delta);
    }

    syncToggle() {
      const t = this.motionToggle;
      if (!t) return;
      t.setAttribute('aria-pressed', String(this.motionOff));
      t.setAttribute('aria-label', this.motionOff ? t.dataset.labelPlay : t.dataset.labelPause);
      t.textContent = this.motionOff ? '▶' : 'Ⅱ';
    }
  }

  /* ---------- Creazioni: filtri per categoria ---------- */
  class ProductFilter extends HTMLElement {
    connectedCallback() {
      this.buttons = [...this.querySelectorAll('[data-filter]')];
      this.items = [...this.querySelectorAll('[data-product]')];
      this.grid = this.querySelector('[data-grid]');
      this.empty = this.querySelector('[data-empty]');
      this.buttons.forEach((btn) => btn.addEventListener('click', () => this.apply(btn.dataset.filter)));
    }

    apply(value) {
      this.buttons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.filter === value)));
      let shown = 0;
      this.items.forEach((item) => {
        const match = value === 'all' || (item.dataset.tags || '').split(/\s+/).includes(value);
        item.hidden = !match;
        if (match) shown += 1;
      });
      // come in style.css: con un filtro attivo le card visibili si allineano
      this.grid?.classList.toggle('is-filtered', shown < this.items.length);
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

    if (e.target instanceof HTMLDialogElement && e.target.open) {
      const r = e.target.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) e.target.close();
    }
  });

  // Riapre il modale dopo l'invio del modulo (conferma o errori)
  if (!window.Shopify?.designMode) {
    document.querySelectorAll('dialog').forEach((dialog) => {
      if (dialog.querySelector('[data-form-status]') && !dialog.open) dialog.showModal();
    });
  }
})();

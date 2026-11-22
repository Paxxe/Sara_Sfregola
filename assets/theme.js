/* Sara Sfregola — Atelier theme */
(() => {
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ---------- Header: menu mobile ---------- */
  /* ---------- Header: megamenu desktop + menu mobile ---------- */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      this.toggle = this.querySelector('[data-menu-toggle]');
      this.mobileNav = this.querySelector('[data-mobile-nav]');
      this.backdrop = this.querySelector('[data-mega-backdrop]');
      this.current = null;
      this.canHover = window.matchMedia('(hover: hover)').matches;

      // Megamenu desktop
      this.querySelectorAll('[data-mega-item]').forEach((item) => {
        const trigger = item.querySelector('[data-mega-trigger]');

        item.addEventListener('mouseenter', () => {
          if (!this.canHover) return;
          clearTimeout(this.closeTimer);
          clearTimeout(this.openTimer);
          if (!trigger) return this.closeMega();
          // piccolo ritardo per non aprire il pannello passando col mouse
          this.openTimer = setTimeout(() => this.openMega(item), this.current ? 0 : 90);
        });

        item.addEventListener('mouseleave', () => {
          if (!this.canHover) return;
          clearTimeout(this.openTimer);
          this.closeTimer = setTimeout(() => this.closeMega(), 180);
        });

        if (!trigger) return;

        // Touch / primo click: apre il pannello; secondo click segue il link
        trigger.addEventListener('click', (e) => {
          if (this.current !== item) {
            e.preventDefault();
            this.openMega(item);
          }
        });

        // Tastiera: freccia giù apre e porta il focus nel pannello
        trigger.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.openMega(item);
            item.querySelector('[data-mega-panel] a')?.focus();
          }
        });

        item.addEventListener('focusout', (e) => {
          if (this.current === item && !item.contains(e.relatedTarget)) this.closeMega();
        });
      });

      // Menu mobile
      this.toggle?.addEventListener('click', () => this.setMobile(!this.mobileNav?.hasAttribute('data-open')));
      this.mobileNav?.addEventListener('click', (e) => {
        if (e.target.closest('a')) this.setMobile(false);
      });

      this.onKey = (e) => {
        if (e.key !== 'Escape') return;
        if (this.current) {
          const trigger = this.current.querySelector('[data-mega-trigger]');
          this.closeMega();
          trigger?.focus();
        }
        this.setMobile(false);
      };
      this.onDocClick = (e) => {
        if (this.current && !this.contains(e.target)) this.closeMega();
      };
      this.onResize = () => {
        if (window.innerWidth >= 721) this.setMobile(false);
        else this.closeMega();
      };
      document.addEventListener('keydown', this.onKey);
      document.addEventListener('click', this.onDocClick);
      window.addEventListener('resize', this.onResize);

      // Theme editor: selezionando un blocco Megamenu si apre il pannello
      this.onBlockSelect = (e) => {
        const item = this.contains(e.target) ? e.target.closest('[data-mega-item]') : null;
        if (item) this.openMega(item);
      };
      this.onBlockDeselect = () => this.closeMega();
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      document.addEventListener('shopify:block:deselect', this.onBlockDeselect);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKey);
      document.removeEventListener('click', this.onDocClick);
      window.removeEventListener('resize', this.onResize);
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
      document.removeEventListener('shopify:block:deselect', this.onBlockDeselect);
      document.documentElement.classList.remove('overflow-hidden');
    }

    openMega(item) {
      if (this.current === item) return;
      this.closeMega();
      const panel = item.querySelector('[data-mega-panel]');
      const trigger = item.querySelector('[data-mega-trigger]');
      if (!panel) return;
      this.current = item;
      panel.setAttribute('data-open', '');
      trigger?.setAttribute('aria-expanded', 'true');
      this.setAttribute('data-mega', '');
      this.backdrop?.setAttribute('data-open', '');
    }

    closeMega() {
      if (!this.current) return;
      this.current.querySelector('[data-mega-panel]')?.removeAttribute('data-open');
      this.current.querySelector('[data-mega-trigger]')?.setAttribute('aria-expanded', 'false');
      this.current = null;
      this.removeAttribute('data-mega');
      this.backdrop?.removeAttribute('data-open');
    }

    setMobile(open) {
      if (!this.mobileNav || !this.toggle) return;
      this.mobileNav.toggleAttribute('data-open', open);
      this.toggleAttribute('data-mobile', open);
      document.documentElement.classList.toggle('overflow-hidden', open);
      this.toggle.setAttribute('aria-expanded', String(open));
      this.toggle.setAttribute('aria-label', open ? this.toggle.dataset.labelClose : this.toggle.dataset.labelOpen);
      const icon = this.toggle.querySelector('[data-menu-icon]');
      if (icon) icon.textContent = open ? '×' : '☰';
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

  /* ---------- PDP: varianti, prezzo, pulsante ---------- */
  class ProductInfo extends HTMLElement {
    connectedCallback() {
      const json = this.querySelector('[data-variants]');
      this.variants = json ? JSON.parse(json.textContent) : [];
      this.inputs = [...this.querySelectorAll('[data-option-index]')];
      this.idInput = this.querySelector('[data-variant-id]');
      this.button = this.querySelector('[data-add-button]');
      this.price = this.querySelector('[data-price]');
      this.compare = this.querySelector('[data-compare-price]');
      this.sku = this.querySelector('[data-sku]');
      this.consultVariant = this.querySelector('[data-consult-variant]');
      this.consultSummary = this.querySelector('[data-consult-summary]');
      this.service = this.querySelector('[data-personal-service]');
      this.money = new Intl.NumberFormat(document.documentElement.lang || 'it', {
        style: 'currency',
        currency: this.dataset.currency || 'EUR',
      });
      this.inputs.forEach((input) => input.addEventListener('change', () => this.onChange(input)));
      this.updateBespoke(this.selectedValues());
    }

    // Valori scelti per ogni opzione: menu a tendina o pulsanti radio (colore / taglia)
    selectedValues() {
      const values = [];
      this.inputs.forEach((input) => {
        const i = Number(input.dataset.optionIndex);
        if (input.type === 'radio') {
          if (input.checked) values[i] = input.value;
        } else {
          values[i] = input.value;
        }
      });
      return values;
    }

    onChange(input) {
      // "Colore · Rame": aggiorna il nome del valore scelto
      const label = input?.closest('[data-option-group]')?.querySelector('[data-option-selected]');
      if (label) label.textContent = input.value;

      const values = this.selectedValues();
      this.updateBespoke(values);
      const variant = this.variants.find((v) => v.options.every((opt, i) => opt === values[i]));

      if (!variant) {
        this.setButton(false, this.dataset.labelUnavailable);
        return;
      }

      if (this.idInput) this.idInput.value = variant.id;
      if (this.price) this.price.textContent = this.money.format(variant.price / 100);
      if (this.compare) {
        const onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
        this.compare.classList.toggle('hidden', !onSale);
        if (onSale) this.compare.textContent = this.money.format(variant.compare_at_price / 100);
      }
      if (this.sku) this.sku.textContent = variant.sku || '';
      if (this.consultVariant) this.consultVariant.value = variant.title;
      if (this.consultSummary) {
        const title = this.consultSummary.textContent.split('·')[0].trim();
        this.consultSummary.textContent = `${title} · ${variant.title}`;
      }
      this.setButton(variant.available, variant.available ? this.dataset.labelAdd : this.dataset.labelSoldOut);

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);

      if (variant.featured_media) {
        this.querySelector('product-gallery')?.showMedia(variant.featured_media.id);
      }
    }

    // Scelta "Su misura": evidenzia il riquadro consulenza
    updateBespoke(values) {
      if (!this.service) return;
      const bespoke = (this.service.dataset.bespoke || '').trim().toLowerCase();
      const active = !!bespoke && values.some((v) => (v || '').trim().toLowerCase() === bespoke);
      this.service.classList.toggle('is-bespoke', active);
    }

    setButton(enabled, label) {
      if (!this.button) return;
      this.button.disabled = !enabled;
      this.button.textContent = label;
    }
  }

  /* ---------- PDP: galleria (carosello su mobile) ---------- */
  class ProductGallery extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-gallery-track]');
      this.counter = this.querySelector('[data-gallery-counter]');
      this.slides = [...this.querySelectorAll('[data-media-id]')];
      this.zoom = this.querySelector('[data-zoom-dialog]');
      if (this.zoom) this.initZoom();
      if (!this.track || !this.counter) return;
      this.track.addEventListener(
        'scroll',
        () => {
          const i = Math.round(this.track.scrollLeft / (this.slides[0]?.offsetWidth || 1));
          this.counter.textContent = `${pad(clamp(i, 0, this.slides.length - 1) + 1)} / ${pad(this.slides.length)}`;
        },
        { passive: true }
      );
    }

    /* --- Zoom: visualizzatore a schermo intero --- */
    initZoom() {
      const zoom = this.zoom;
      this.zTrack = zoom.querySelector('[data-zoom-track]');
      this.zSlides = [...zoom.querySelectorAll('[data-zoom-slide]')];
      this.zCounter = zoom.querySelector('[data-zoom-counter]');
      this.zIndex = 0;
      this.canHover = window.matchMedia('(hover: hover)').matches;

      this.querySelectorAll('[data-zoom-open]').forEach((btn) =>
        btn.addEventListener('click', () => this.openZoom(Number(btn.dataset.zoomOpen)))
      );
      zoom.querySelector('[data-zoom-prev]')?.addEventListener('click', () => this.zoomGo(this.zIndex - 1));
      zoom.querySelector('[data-zoom-next]')?.addEventListener('click', () => this.zoomGo(this.zIndex + 1));

      this.zTrack.addEventListener(
        'scroll',
        () => {
          const i = Math.round(this.zTrack.scrollLeft / (this.zTrack.clientWidth || 1));
          if (i !== this.zIndex) {
            this.zIndex = clamp(i, 0, this.zSlides.length - 1);
            this.updateZoomCounter();
          }
        },
        { passive: true }
      );

      this.zSlides.forEach((slide) => {
        const img = slide.querySelector('img');
        img.addEventListener('click', (e) => this.toggleZoom(slide, e));
        slide.addEventListener('mousemove', (e) => {
          if (this.canHover && slide.classList.contains('is-zoomed')) this.panTo(slide, e);
        });
      });

      zoom.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') this.zoomGo(this.zIndex + 1);
        if (e.key === 'ArrowLeft') this.zoomGo(this.zIndex - 1);
      });
      zoom.addEventListener('close', () => {
        this.resetZoom();
        document.documentElement.classList.remove('overflow-hidden');
      });
    }

    openZoom(index) {
      this.zIndex = clamp(index, 0, this.zSlides.length - 1);
      document.documentElement.classList.add('overflow-hidden');
      this.zoom.showModal();
      // carica subito l'immagine scelta
      this.zSlides[this.zIndex].querySelector('img').loading = 'eager';
      requestAnimationFrame(() => {
        this.zTrack.scrollTo({ left: this.zIndex * this.zTrack.clientWidth, behavior: 'instant' });
        this.updateZoomCounter();
      });
    }

    zoomGo(index) {
      const i = clamp(index, 0, this.zSlides.length - 1);
      this.resetZoom();
      this.zTrack.scrollTo({ left: i * this.zTrack.clientWidth, behavior: 'smooth' });
    }

    updateZoomCounter() {
      if (this.zCounter) this.zCounter.textContent = `${pad(this.zIndex + 1)} / ${pad(this.zSlides.length)}`;
    }

    toggleZoom(slide, e) {
      if (slide.classList.contains('is-zoomed')) {
        this.resetZoom();
        return;
      }
      const img = slide.querySelector('img');
      const rect = img.getBoundingClientRect();
      const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      // larghezza dell'immagine "contenuta" a schermo, poi ingrandita 2,5x
      const fitted = Math.min(slide.clientWidth, slide.clientHeight * ratio);
      const rx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const ry = clamp((e.clientY - rect.top) / rect.height, 0, 1);

      this.resetZoom();
      img.style.width = `${Math.round(fitted * 2.5)}px`;
      slide.classList.add('is-zoomed');
      this.zTrack.classList.add('is-locked');
      requestAnimationFrame(() => {
        slide.scrollLeft = rx * (slide.scrollWidth - slide.clientWidth);
        slide.scrollTop = ry * (slide.scrollHeight - slide.clientHeight);
      });
    }

    panTo(slide, e) {
      const rect = slide.getBoundingClientRect();
      const rx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const ry = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      slide.scrollLeft = rx * (slide.scrollWidth - slide.clientWidth);
      slide.scrollTop = ry * (slide.scrollHeight - slide.clientHeight);
    }

    resetZoom() {
      this.zSlides?.forEach((slide) => {
        slide.classList.remove('is-zoomed');
        slide.scrollTo(0, 0);
        const img = slide.querySelector('img');
        if (img) img.style.width = '';
      });
      this.zTrack?.classList.remove('is-locked');
    }

    showMedia(id) {
      const slide = this.slides.find((s) => s.dataset.mediaId === String(id));
      if (!slide) return;
      if (this.track && this.track.scrollWidth > this.track.clientWidth) {
        // mobile: scorre il carosello
        this.track.scrollTo({ left: slide.offsetLeft - this.track.offsetLeft, behavior: 'smooth' });
      } else if (slide.getBoundingClientRect().top < 0 || slide.getBoundingClientRect().bottom > window.innerHeight) {
        slide.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  /* ---------- PDP: raccomandazioni Shopify ---------- */
  class ProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (!this.dataset.url || this.children.length) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          this.load();
        },
        { rootMargin: '0px 0px 400px 0px' }
      );
      observer.observe(this);
    }

    async load() {
      try {
        const res = await fetch(this.dataset.url);
        const html = await res.text();
        const fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('product-recommendations');
        if (fresh && fresh.innerHTML.trim()) {
          this.innerHTML = fresh.innerHTML;
        } else {
          this.closest('.shopify-section')?.setAttribute('hidden', '');
        }
      } catch (e) {
        this.closest('.shopify-section')?.setAttribute('hidden', '');
      }
    }
  }

  customElements.get('product-info') || customElements.define('product-info', ProductInfo);
  customElements.get('product-gallery') || customElements.define('product-gallery', ProductGallery);
  customElements.get('product-recommendations') ||
    customElements.define('product-recommendations', ProductRecommendations);

  /* ---------- PLP: "Ordina per" e menu filtri ---------- */
  document.addEventListener('change', (e) => {
    const select = e.target.closest('[data-sort-select]');
    if (!select) return;
    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', select.value);
    url.searchParams.delete('page');
    window.location.href = url.toString();
  });

  // Chiude il menu "Filtra" cliccando fuori o con Esc
  document.addEventListener('click', (e) => {
    document.querySelectorAll('[data-filter-dropdown][open]').forEach((d) => {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-filter-dropdown][open]').forEach((d) => {
      d.removeAttribute('open');
      d.querySelector('summary')?.focus();
    });
  });

  /* ---------- Carrello: + / − e aggiornamento automatico ---------- */
  document.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (!step) return;
    const input = step.closest('[data-quantity]')?.querySelector('input');
    if (!input) return;
    input.value = Math.max(0, (parseInt(input.value, 10) || 0) + Number(step.dataset.step));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  document.addEventListener('change', (e) => {
    const input = e.target.closest('[data-autosubmit]');
    if (!input) return;
    const form = input.form;
    clearTimeout(form._submitTimer);
    // piccolo ritardo per raccogliere più click su + / −
    form._submitTimer = setTimeout(() => {
      const update = document.createElement('input');
      update.type = 'hidden';
      update.name = 'update';
      update.value = '1';
      form.appendChild(update);
      form.submit();
    }, 450);
  });

  // Ferma i video quando si chiude la finestra
  document.addEventListener(
    'close',
    (e) => {
      if (!(e.target instanceof HTMLDialogElement)) return;
      e.target.querySelectorAll('video').forEach((v) => v.pause());
      e.target.querySelectorAll('iframe').forEach((f) => {
        f.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        f.contentWindow?.postMessage('{"method":"pause"}', '*');
      });
    },
    true
  );

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

/**
 * SaXham Technologies — Main JavaScript
 * Homepage interactions:
 * - Responsive mobile navigation with keyboard support
 * - Current-page navigation state
 * - Accessible FAQ accordion
 * - Scroll progress indicator
 * - Back-to-top button
 * - Enquiry form validation and double-submit protection
 *
 * Include near the end of the page with defer:
 * <script src="assets/js/main.js" defer></script>
 */
(() => {
  "use strict";

  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  onReady(() => {
    const reduceMotion = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    /* -------------------------------------------------------
       Footer year
    ------------------------------------------------------- */
    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    /* -------------------------------------------------------
       Mobile navigation
       Expected HTML:
       .mobile-toggle[aria-controls="mobile-menu"]
       #mobile-menu
       .mobile-overlay
       .mobile-close
    ------------------------------------------------------- */
    const menuToggle = $(".mobile-toggle");
    const mobileMenu = $("#mobile-menu");
    const mobileOverlay = $(".mobile-overlay");
    const menuClose = $(".mobile-close");
    const mobileNavLinks = mobileMenu ? $$("a[href]", mobileMenu) : [];
    const desktopQuery = window.matchMedia("(min-width: 821px)");

    let menuOpen = false;
    let previouslyFocused = null;
    let previousBodyOverflow = "";

    const visibleFocusableElements = (container) => {
      if (!container) return [];

      return $$(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        container
      ).filter((element) => {
        return !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0;
      });
    };

    const openMenu = () => {
      if (!menuToggle || !mobileMenu || !mobileOverlay || menuOpen) return;

      menuOpen = true;
      previouslyFocused = document.activeElement;
      previousBodyOverflow = document.body.style.overflow;

      mobileMenu.classList.add("active");
      mobileOverlay.classList.add("active");
      document.body.classList.add("mobile-menu-open");
      document.body.style.overflow = "hidden";

      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close menu");
      mobileMenu.setAttribute("aria-hidden", "false");
      mobileOverlay.setAttribute("aria-hidden", "false");

      const firstFocusable = visibleFocusableElements(mobileMenu)[0];
      if (firstFocusable) {
        window.requestAnimationFrame(() => firstFocusable.focus());
      }
    };

    const closeMenu = ({ restoreFocus = true } = {}) => {
      if (!menuToggle || !mobileMenu || !mobileOverlay || !menuOpen) return;

      menuOpen = false;

      mobileMenu.classList.remove("active", "open", "is-open");
      mobileOverlay.classList.remove("active", "open", "is-open");
      document.body.classList.remove("mobile-menu-open");
      document.body.style.overflow = previousBodyOverflow;

      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileOverlay.setAttribute("aria-hidden", "true");

      if (restoreFocus && previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };

    if (menuToggle && mobileMenu && mobileOverlay) {
      // Establish the initial accessibility state.
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileOverlay.setAttribute("aria-hidden", "true");

      menuToggle.addEventListener("click", () => {
        if (menuOpen) closeMenu();
        else openMenu();
      });

      if (menuClose) {
        menuClose.addEventListener("click", () => closeMenu());
      }

      mobileOverlay.addEventListener("click", () => closeMenu());

      mobileNavLinks.forEach((link) => {
        link.addEventListener("click", () => closeMenu({ restoreFocus: false }));
      });

      document.addEventListener("keydown", (event) => {
        if (!menuOpen) return;

        if (event.key === "Escape") {
          event.preventDefault();
          closeMenu();
          return;
        }

        // Keep keyboard focus within the open drawer.
        if (event.key === "Tab") {
          const focusable = visibleFocusableElements(mobileMenu);
          if (!focusable.length) {
            event.preventDefault();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });

      const onDesktopBreakpoint = (event) => {
        if (event.matches && menuOpen) closeMenu({ restoreFocus: false });
      };

      if (typeof desktopQuery.addEventListener === "function") {
        desktopQuery.addEventListener("change", onDesktopBreakpoint);
      } else if (typeof desktopQuery.addListener === "function") {
        desktopQuery.addListener(onDesktopBreakpoint);
      }
    }

    /* -------------------------------------------------------
       Active navigation state
       Handles the homepage, normal pages and /blog/ routes.
    ------------------------------------------------------- */
    const normalizePath = (path) => {
      const withoutTrailingSlash = path.replace(/\/+$/, "");
      return withoutTrailingSlash || "/";
    };

    const currentPath = normalizePath(window.location.pathname);
    const navLinks = $$(".nav-link, .mobile-link");

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let linkPath;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        linkPath = normalizePath(url.pathname);
      } catch (_error) {
        return;
      }

      const isHomeLink = linkPath === "/" || linkPath.endsWith("/index.html");
      const isCurrentHome = currentPath === "/" || currentPath.endsWith("/index.html");

      // The Blog item remains active on all pages below /blog/.
      const isBlogSection = linkPath.endsWith("/blog") &&
        (currentPath === linkPath || currentPath.startsWith(`${linkPath}/`));

      const isCurrent = (isHomeLink && isCurrentHome) ||
        linkPath === currentPath ||
        isBlogSection;

      link.classList.toggle("active", isCurrent);

      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else if (link.getAttribute("aria-current") === "page") {
        link.removeAttribute("aria-current");
      }
    });

    /* -------------------------------------------------------
       FAQ accordion
       Supports multiple open answers.
       Keeps aria-expanded and aria-hidden synchronized.
    ------------------------------------------------------- */
    const accordionItems = $$(".accordion-item");

    accordionItems.forEach((item, index) => {
      const trigger = $(".accordion-header", item);
      const panel = $(".accordion-body", item);
      if (!trigger || !panel) return;

      // Add stable relationships if they are not already in the HTML.
      if (!panel.id) panel.id = `faq-panel-${index + 1}`;
      trigger.setAttribute("aria-controls", panel.id);

      const initiallyOpen = item.classList.contains("active") ||
        trigger.getAttribute("aria-expanded") === "true";

      item.classList.toggle("active", initiallyOpen);
      trigger.setAttribute("aria-expanded", String(initiallyOpen));
      panel.setAttribute("aria-hidden", String(!initiallyOpen));

      trigger.addEventListener("click", () => {
        const willOpen = trigger.getAttribute("aria-expanded") !== "true";

        item.classList.toggle("active", willOpen);
        trigger.setAttribute("aria-expanded", String(willOpen));
        panel.setAttribute("aria-hidden", String(!willOpen));
      });
    });

    /* -------------------------------------------------------
       Scroll progress + back-to-top
       One requestAnimationFrame handler updates both controls.
    ------------------------------------------------------- */
    const progressBar = $("#progress-bar");
    const backToTop = $("#backToTop");
    const backToTopThreshold = 420;
    let scrollFramePending = false;

    const updateScrollUI = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const availableScroll = Math.max(0, scrollHeight - window.innerHeight);

      if (progressBar) {
        const percentage = availableScroll > 0
          ? Math.min(100, Math.max(0, (scrollTop / availableScroll) * 100))
          : 0;

        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute("aria-valuenow", String(Math.round(percentage)));
      }

      if (backToTop) {
        const shouldShow = scrollTop > backToTopThreshold;
        backToTop.classList.toggle("show", shouldShow);
        backToTop.classList.toggle("visible", shouldShow);
        backToTop.setAttribute("aria-hidden", String(!shouldShow));
        backToTop.tabIndex = shouldShow ? 0 : -1;
      }

      scrollFramePending = false;
    };

    const scheduleScrollUIUpdate = () => {
      if (scrollFramePending) return;
      scrollFramePending = true;
      window.requestAnimationFrame(updateScrollUI);
    };

    window.addEventListener("scroll", scheduleScrollUIUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollUIUpdate);
    window.addEventListener("load", scheduleScrollUIUpdate);
    updateScrollUI();

    if (backToTop) {
      backToTop.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      });
    }

    /* -------------------------------------------------------
       Contact / enquiry form
       The current HTML posts to FormSubmit.
       Native required/email validation is retained.
       This script does not fake a success message: FormSubmit
       handles the actual delivery and response.
    ------------------------------------------------------- */
    const enquiryForms = $$(".contact-form");

    enquiryForms.forEach((form) => {
      const submitButton = $('button[type="submit"], input[type="submit"]', form);
      const honeypot = $('[name="_honey"]', form);
      let isSubmitting = false;

      let status = $(".form-status", form);
      if (!status) {
        status = document.createElement("p");
        status.className = "form-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.hidden = true;
        form.appendChild(status);
      }

      const restoreSubmitButton = () => {
        isSubmitting = false;
        if (!submitButton) return;

        submitButton.disabled = false;
        submitButton.removeAttribute("aria-disabled");

        const originalLabel = submitButton.dataset.originalLabel;
        if (originalLabel !== undefined) {
          if (submitButton instanceof HTMLInputElement) {
            submitButton.value = originalLabel;
          } else {
            submitButton.textContent = originalLabel;
          }
        }
      };

      form.addEventListener("submit", (event) => {
        // Browser constraint validation normally runs before submit.
        if (!form.checkValidity()) {
          event.preventDefault();
          form.reportValidity();
          return;
        }

        // Silently discard bot submissions caught by the honeypot.
        if (honeypot && honeypot.value.trim() !== "") {
          event.preventDefault();
          return;
        }

        // Avoid duplicate clicks while the browser submits the form.
        if (isSubmitting) {
          event.preventDefault();
          return;
        }

        isSubmitting = true;

        if (submitButton) {
          submitButton.dataset.originalLabel =
            submitButton instanceof HTMLInputElement
              ? submitButton.value
              : submitButton.textContent.trim();

          submitButton.disabled = true;
          submitButton.setAttribute("aria-disabled", "true");

          if (submitButton instanceof HTMLInputElement) {
            submitButton.value = "Submitting...";
          } else {
            submitButton.textContent = "Submitting...";
          }
        }

        status.textContent = "Submitting your enquiry. Please wait...";
        status.hidden = false;
      });

      // Restore state when the page is revisited from browser history.
      window.addEventListener("pageshow", restoreSubmitButton);
    });

    /* -------------------------------------------------------
       In-page anchor links
       Smoothly scroll to valid same-page targets.
    ------------------------------------------------------- */
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const targetId = anchor.getAttribute("href");
        if (!targetId || targetId === "#") return;

        let target;
        try {
          target = document.querySelector(targetId);
        } catch (_error) {
          return;
        }

        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });

        // Keep the URL useful for direct linking without adding history entries.
        if (window.history && typeof window.history.replaceState === "function") {
          try {
            window.history.replaceState(null, "", targetId);
          } catch (_error) {
            // Ignore restrictions in local-file or embedded previews.
          }
        }
      });
    });
  });
})();


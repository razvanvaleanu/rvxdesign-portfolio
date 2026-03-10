const siteHeader = document.getElementById("siteHeader");
const revealElements = document.querySelectorAll(".reveal");
const popElements = document.querySelectorAll(".pop-on-scroll");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const mobileNavLinks = document.querySelectorAll(".mobile-nav a");
let lenisInstance = null;

const carouselData = {
  productCarousel: [
    { title: "Portable Power Bank", image: "images/product-1.jpg" },
    { title: "Coffee Maker", image: "images/product-2.jpg" },
    { title: "Headphones", image: "images/product-3.jpg" },
    { title: "Camera Lens", image: "images/product-4.jpg" }
  ],
  industrialCarousel: [
    { title: "Foundation Grounding", image: "images/industrial-1.jpg" },
    { title: "Solar Panel Mount", image: "images/industrial-2.jpg" },
    { title: "AC routing", image: "images/industrial-3.jpg" }
  ],
  archCarousel: [
    { title: "Simple Living Room", image: "images/arch-1.jpg" },
    { title: "Walnut Executive Desk", image: "images/arch-2.jpg" }
  ],
  gameCarousel: [
    { title: "Chinese Architecture", image: "images/game-1.jpg" },
    { title: "LowPoly Subaru", image: "images/game-2.jpg" },
    { title: "Jungle Market Stall", image: "images/game-3.jpg" }
  ]
};

const lenis = new Lenis({
  duration: 1.5,
  smoothWheel: true,
  smoothTouch: true,
  wheelMultiplier: 0.7
});

function setupLenis() {
  if (typeof Lenis === "undefined") return null;

  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    smoothTouch: false,
    touchMultiplier: 1.1,
    wheelMultiplier: 0.9
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  lenis.on("scroll", () => {
    handleHeaderVisibility();
  });

  return lenis;
}

function setupSmoothAnchorLinks() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      event.preventDefault();

      if (lenisInstance) {
        lenisInstance.scrollTo(targetElement, {
          offset: -20,
          duration: 1.2
        });
      } else {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }

      siteHeader.classList.remove("mobile-open");
    });
  });
}


function forcePageStartAtTop() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  window.scrollTo(0, 0);

  window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
  });
}

function handleHeaderVisibility() {
  const trigger = window.innerHeight * 0.12;

  if (window.scrollY > trigger) {
    siteHeader.classList.add("is-visible");
  } else {
    siteHeader.classList.remove("is-visible");
    siteHeader.classList.remove("mobile-open");
  }
}

function setupRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    {
      threshold: 0.05,
      rootMargin: "-5% 0px -5% 0px"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
  popElements.forEach((element) => observer.observe(element));
}

function setupMobileMenu() {
  if (!mobileMenuToggle) return;

  mobileMenuToggle.addEventListener("click", () => {
    siteHeader.classList.toggle("mobile-open");
  });

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader.classList.remove("mobile-open");
    });
  });
}

function createCardMarkup(project) {
  if (!project.image) {
    return `
      <article class="trapezoid-card placeholder">
        <div class="card-overlay"><span>Coming Soon</span></div>
      </article>
    `;
  }

  return `
    <article class="trapezoid-card">
      <img src="${project.image}" alt="${project.title}" />
      <div class="card-overlay"><span>${project.title}</span></div>
    </article>
  `;
}

function buildCarouselCards(carouselId, projects, minimumCards = 4) {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;

  const track = carousel.querySelector(".trapezoid-track");
  if (!track) return;

  const safeProjects = Array.isArray(projects) ? [...projects] : [];
  const cards = [...safeProjects];

  while (cards.length < minimumCards) {
    cards.push({
      title: "Coming Soon",
      image: ""
    });
  }

  track.innerHTML = cards.map(createCardMarkup).join("");
}

function createInfiniteTrack(track) {
  const originalCards = Array.from(track.children);

  originalCards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });
}

function setupTrapezoidCarousel(carouselId) {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;

  const track = carousel.querySelector(".trapezoid-track");
  if (!track) return;

  if (track.children.length === 0) return;

  createInfiniteTrack(track);

  const getCardWidth = () => {
    const firstCard = track.querySelector(".trapezoid-card");
    return firstCard ? firstCard.getBoundingClientRect().width : 0;
  };

  const getGapWidth = () => {
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || "0");
    return Number.isNaN(gap) ? 0 : gap;
  };

  const getStep = () => getCardWidth() + getGapWidth();

  const getVisibleWidth = () => carousel.getBoundingClientRect().width;

  const getCenterOffset = () => {
    const visibleWidth = getVisibleWidth();
    const cardWidth = getCardWidth();
    return (visibleWidth - cardWidth) / 2;
  };

  let currentPosition = 0;
  let targetPosition = 0;
  let currentSpeed = 0.38;
  let targetSpeed = 0.38;
  const baseSpeedDesktop = 0.38;
  const baseSpeedMobile = 0.28;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartTarget = 0;

  let pauseTimeout = null;
  let animationFrame = null;
  let isInView = false;
  let dragDeltaX = 0;

  function getBaseSpeed() {
    return window.innerWidth <= 720 ? baseSpeedMobile : baseSpeedDesktop;
  }

  function getLoopWidth() {
    return track.scrollWidth / 2;
  }



  function wrapPosition(value, loopWidth) {
    if (loopWidth === 0) return value;

    let wrapped = value % loopWidth;

    if (wrapped > 0) {
        wrapped -= loopWidth;
    }

    return wrapped;
    }

    function render() {
    const loopWidth = getLoopWidth();
    const renderPosition = wrapPosition(currentPosition, loopWidth);
    track.style.transform = `translate3d(${renderPosition}px, 0, 0)`;
    }

  function getNearestSnapPosition(rawPosition) {
    const step = getStep();
    const centerOffset = getCenterOffset();

    if (step === 0) return rawPosition;

    const relativeIndex = Math.round((centerOffset - rawPosition) / step);
    return centerOffset - relativeIndex * step;
    }

  function snapToNearest(duration = 1600) {
    targetPosition = getNearestSnapPosition(targetPosition);
    pauseAutoMotion(duration);
  }

  function pauseAutoMotion(duration = 2200) {
    targetSpeed = 0;

    clearTimeout(pauseTimeout);
    pauseTimeout = setTimeout(() => {
      targetSpeed = getBaseSpeed();
    }, duration);
  }

  function animate() {
    currentSpeed += (targetSpeed - currentSpeed) * 0.045;

    if (!isDragging && isInView) {
        targetPosition -= currentSpeed;
    }

    currentPosition += (targetPosition - currentPosition) * 0.11;

    render();
    animationFrame = requestAnimationFrame(animate);
    }

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
        isInView = entry.isIntersecting;

        if (!isInView) {
            targetSpeed = 0;
        } else {
            targetSpeed = getBaseSpeed();
        }
        });
    },
    {
        threshold: 0.2
    }
    );

    visibilityObserver.observe(carousel);

  function onDragStart(clientX) {
    isDragging = true;
    carousel.classList.add("is-dragging");

    dragStartX = clientX;
    dragStartTarget = targetPosition;
    dragDeltaX = 0;

    targetSpeed = 0;
    clearTimeout(pauseTimeout);
    }

  function onDragMove(clientX) {
    if (!isDragging) return;

    const step = getStep();
    const maxDrag = step * 1.15;
    const rawDelta = clientX - dragStartX;
    const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, rawDelta));

    dragDeltaX = clampedDelta;
    targetPosition = dragStartTarget + clampedDelta;
    }

  function onDragEnd() {
    if (!isDragging) return;

    isDragging = false;
    carousel.classList.remove("is-dragging");

    const step = getStep();
    const isMobile = window.innerWidth <= 720;
    const swipeThreshold = isMobile ? step * 0.14 : step * 0.1;

    if (Math.abs(dragDeltaX) > swipeThreshold) {
        if (dragDeltaX < 0) {
        targetPosition = getNearestSnapPosition(dragStartTarget - step);
        } else {
        targetPosition = getNearestSnapPosition(dragStartTarget + step);
        }
    } else {
        targetPosition = getNearestSnapPosition(dragStartTarget);
    }

    pauseAutoMotion(isMobile ? 1800 : 1400);
    }

  carousel.addEventListener("mousedown", (event) => {
    onDragStart(event.clientX);
  });

  window.addEventListener("mousemove", (event) => {
    onDragMove(event.clientX);
  });

  window.addEventListener("mouseup", onDragEnd);
  carousel.addEventListener("mouseleave", onDragEnd);

  carousel.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length > 0) {
        onDragStart(event.touches[0].clientX);
      }
    },
    { passive: true }
  );

  carousel.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 0) {
        onDragMove(event.touches[0].clientX);
      }
    },
    { passive: true }
  );

  carousel.addEventListener("touchend", onDragEnd);

  carousel.addEventListener("mouseenter", () => {
    targetSpeed = 0;
    clearTimeout(pauseTimeout);
  });

  carousel.addEventListener("mouseleave", () => {
    if (!isDragging) {
      snapToNearest(1200);
    }
  });

  const arrows = document.querySelectorAll(`[data-carousel="${carouselId}"]`);

  arrows.forEach((arrow) => {
    arrow.addEventListener("click", () => {
      const direction = Number(arrow.dataset.direction || 1);
      const step = getStep();

      targetPosition -= direction * step;
      targetPosition = getNearestSnapPosition(targetPosition);

      pauseAutoMotion(window.innerWidth <= 720 ? 2100 : 1500);
    });
  });

  function setInitialCenteredPosition() {
    const centered = getCenterOffset();
    currentPosition = centered;
    targetPosition = centered;
    currentSpeed = getBaseSpeed();
    targetSpeed = getBaseSpeed();
    render();
  }

  function handleResize() {
    const snappedPosition = getNearestSnapPosition(currentPosition);
    currentPosition = snappedPosition;
    targetPosition = snappedPosition;
    render();
  }

  setInitialCenteredPosition();
  animate();

  window.addEventListener("resize", handleResize);

  window.addEventListener("beforeunload", () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
}

window.addEventListener("scroll", handleHeaderVisibility);

window.addEventListener("load", () => {
  forcePageStartAtTop();

  lenisInstance = setupLenis();

  handleHeaderVisibility();
  setupRevealAnimations();
  setupMobileMenu();
  setupSmoothAnchorLinks();

  Object.entries(carouselData).forEach(([carouselId, projects]) => {
    buildCarouselCards(carouselId, projects, 4);
    setupTrapezoidCarousel(carouselId);
  });
});
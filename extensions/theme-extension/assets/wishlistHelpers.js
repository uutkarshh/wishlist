(function () {
  async function addToWishlist(productId, button) {
    console.log("Add product to DB:", productId);
    button.innerHTML = "❤️";
    button.classList.add("wishlist-icon--clicked");

    try {
      const res = await fetch("/apps/utk/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerId: window.loggedInCustomerId, // Make sure this is set globally
        }),
      });

      const result = await res.json();

      if (result.success) {
        showToast(`✅ Product added to wishlist`);
      } else {
        console.warn("❌ DB add failed:", result.error || result.message);
        showToast(`⚠️ Failed to add product to wishlist`);
      }
    } catch (err) {
      console.error("❌ Error adding product:", err);
      showToast(`⚠️ Error adding to wishlist`);
    }
  }
  async function removeFromWishlist(productId, button) {
    console.log("Remove product from DB:", productId);
    button.innerHTML = "🤍";
    button.classList.remove("wishlist-icon--clicked");

    try {
      const res = await fetch("/apps/utk/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerId: window.loggedInCustomerId,
        }),
      });

      const result = await res.json();

      if (result.success) {
        showToast(`❌ Product removed from wishlist`);
      } else {
        console.warn("❌ DB remove failed:", result.error || result.message);
        showToast(`⚠️ Failed to remove from wishlist`);
      }
    } catch (err) {
      console.error("❌ Error removing product:", err);
      showToast(`⚠️ Error removing from wishlist`);
    }
  }
  function showToast(message) {
    const existing = document.querySelector(".wishlist-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.innerText = message;
    toast.className = "wishlist-toast";
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.padding = "10px 20px";
    toast.style.background = "#333";
    toast.style.color = "#fff";
    toast.style.borderRadius = "6px";
    toast.style.zIndex = "9999";
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 1500);
  }
  function getProductIdFromLink(link) {
    const href = link.getAttribute("href");
    if (!href || !href.includes("/products/")) return "";

    try {
      const url = new URL(href, window.location.origin);
      const pid = url.searchParams.get("pr_rec_pid");
      if (pid) return pid;
    } catch {}

    const idMatch = link.id?.match(/(?:[-_])(\d{10,})$/);
    return idMatch ? idMatch[1] : "";
  }
  async function filterWishlistStatus(productId, customerId) {
    try {
      const res = await fetch("/apps/utk/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, customerId }),
      });
      const result = await res.json();
      return result?.exists === true;
    } catch {
      return false;
    }
  }
  async function createWishlistIcon(productId, customerId) {
    if (!productId || !customerId) return document.createTextNode(""); // fallback

    const btn = document.createElement("button");
    btn.className = "wishlist-icon";
    btn.setAttribute("data-product-id", productId);

    const isWishlisted = await filterWishlistStatus(productId, customerId);
    btn.innerHTML = isWishlisted ? "❤️" : "🤍";
    if (isWishlisted) btn.classList.add("wishlist-icon--clicked");

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isRed = btn.innerHTML === "❤️";
      if (isRed) {
        removeFromWishlist(productId, btn, customerId);
      } else {
        addToWishlist(productId, btn, customerId);
      }
    });

    return btn;
  }
  async function injectWishlistIcons(context = document, customerId) {
    const productLinks = Array.from(
      context.querySelectorAll("a.full-unstyled-link"),
    );

    productLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("/products/")) return;

      const wrapper = link.closest(".card__inner, .card__media, .media");
      if (!wrapper || wrapper.querySelector(".wishlist-icon")) return;

      const productId = getProductIdFromLink(link);
      if (!productId) return;

      link.addEventListener("click", () => {
        sessionStorage.setItem("clickedProductId", productId);
      });

      wrapper.style.position = "relative";

      // Add placeholder icon immediately
      const placeholder = document.createElement("button");
      placeholder.innerHTML = ""; // loading spinner placeholder
      placeholder.className = "wishlist-icon wishlist-icon--loading";
      placeholder.style.opacity = "0.5";
      wrapper.appendChild(placeholder);

      // Load the real icon async
      createWishlistIcon(productId, customerId).then((icon) => {
        placeholder.replaceWith(icon);
      });
    });
  }
  function injectWishlistToggleToHeader(customerId) {
    const header = document.querySelector("header");
    if (!header) return;

    if (header.querySelector(".wishlist-toggle-header")) return;

    const toggle = document.createElement("button");
    toggle.innerHTML = "🧡";
    toggle.className = "wishlist-toggle-header";
    toggle.style.cssText = `
    margin-left: auto; padding: 8px 14px; background: transparent;
    color: #fff; border: none; border-radius: 6px;
    cursor: pointer; font-size: 18px;
  `;

    toggle.addEventListener("click", async () => {
      const overlay = showWishlistFullPageOverlay("Loading wishlist...");
      try {
        const res = await fetch("/apps/utk/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId }),
        });
        let products = await res.json();

        // ✅ Reverse the array to show most recent products first
        if (Array.isArray(products)) {
          products = products.reverse();
          updateWishlistOverlayContent(overlay, products);
        } else {
          overlay.innerHTML =
            "<p style='padding: 20px;'>❌ Failed to load wishlist</p>";
        }
      } catch (err) {
        overlay.innerHTML =
          "<p style='padding: 20px;'>⚠️ Error loading wishlist</p>";
      }
    });

    const container =
      header.querySelector(".header__inline-menu") ||
      header.querySelector("nav") ||
      header;
    container.appendChild(toggle);
  }
  function showWishlistFullPageOverlay(initialMessage = "") {
    let existing = document.querySelector(".wishlist-fullpage-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "wishlist-fullpage-overlay";
    overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.9);
    color: #fff; z-index: 10000;
    display: flex; flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.4s ease-in-out;
    padding: 20px;
    box-sizing: border-box;
  `;

    overlay.innerHTML = `<div style="text-align:center; font-size: 18px;">${initialMessage}</div>`;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    return overlay;
  }
  function updateWishlistOverlayContent(overlay, products) {
    overlay.innerHTML = ""; // Clear initial message

    const contentWrapper = document.createElement("div");
    contentWrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    width: 95%;
    max-width: 1000px;
    height: 90%;
    background: #111;
    border-radius: 10px;
    padding: 20px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  `;

    const titleHeader = document.createElement("h2");
    titleHeader.innerText = "Your Wishlist";
    titleHeader.style.cssText = `
    text-align: center;
    margin-bottom: 20px;
    color: #fff;
    flex-shrink: 0;
  `;
    contentWrapper.appendChild(titleHeader);

    // --- Product Slider Container ---
    const sliderContainer = document.createElement("div");
    sliderContainer.style.cssText = `
    flex-grow: 1;
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 40px;
  `;

    const productsSlider = document.createElement("div");
    productsSlider.style.cssText = `
    flex-grow: 1;
    overflow-x: hidden;
    overflow-y: hidden;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 10px 0;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  `;

    if (products.length === 0) {
      productsSlider.innerHTML =
        "<p style='text-align: center; font-size: 16px; color: #aaa; width: 100%;'>Your wishlist is empty. Start adding some items!</p>";
    } else {
      products.forEach((product) => {
        const card = document.createElement("div");
        card.style.cssText = `
        display: inline-block;
        flex-shrink: 0;
        width: 180px;
        background: #222;
        border-radius: 10px;
        padding: 15px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
      `;
        card.onmouseenter = () => (card.style.transform = "scale(1.03)");
        card.onmouseleave = () => (card.style.transform = "scale(1)");
        card.onclick = () => {
          window.location.href = `/products/${product.handle}`;
        };

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.title;
        img.style.cssText = `
        width: 100%;
        height: 160px;
        border-radius: 8px;
        object-fit: cover;
        margin-bottom: 10px;
      `;

        const title = document.createElement("p");
        title.innerText = product.title;
        title.title = product.title;
        title.style.cssText = `
        font-size: 15px;
        color: #fff;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.2em;
        max-height: 2.4em;
      `;

        card.appendChild(img);
        card.appendChild(title);
        productsSlider.appendChild(card);
      });
    }

    sliderContainer.appendChild(productsSlider);

    // Left Arrow Button
    const leftArrow = document.createElement("button");
    leftArrow.innerHTML = "&#10094;"; // Left arrow character
    leftArrow.className = "wishlist-arrow left";
    leftArrow.style.cssText = `
    position: absolute;
    left: 0px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.6);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    z-index: 10;
    transition: background 0.3s, opacity 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
    leftArrow.onmouseenter = () =>
      (leftArrow.style.background = "rgba(0,0,0,0.8)");
    leftArrow.onmouseleave = () =>
      (leftArrow.style.background = "rgba(0,0,0,0.6)");
    sliderContainer.appendChild(leftArrow);

    // Right Arrow Button
    const rightArrow = document.createElement("button");
    rightArrow.innerHTML = "&#10095;"; // Right arrow character
    rightArrow.className = "wishlist-arrow right";
    rightArrow.style.cssText = `
    position: absolute;
    right: 0px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.6);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    z-index: 10;
    transition: background 0.3s, opacity 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
    rightArrow.onmouseenter = () =>
      (rightArrow.style.background = "rgba(0,0,0,0.8)");
    rightArrow.onmouseleave = () =>
      (rightArrow.style.background = "rgba(0,0,0,0.6)");
    sliderContainer.appendChild(rightArrow);

    contentWrapper.appendChild(sliderContainer);

    // Logic for scrolling and arrow visibility
    const scrollAmount = 250; // Pixels to scroll per click

    const updateArrowVisibility = () => {
      const { scrollLeft, scrollWidth, clientWidth } = productsSlider;
      leftArrow.style.opacity = scrollLeft > 0 ? "1" : "0";
      rightArrow.style.opacity =
        scrollLeft < scrollWidth - clientWidth - 1 ? "1" : "0"; // -1 for potential sub-pixel rendering issues

      if (scrollWidth <= clientWidth) {
        leftArrow.style.display = "none";
        rightArrow.style.display = "none";
      } else {
        leftArrow.style.display = "flex";
        rightArrow.style.display = "flex";
      }
    };

    leftArrow.addEventListener("click", () => {
      productsSlider.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    });

    rightArrow.addEventListener("click", () => {
      productsSlider.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    });

    productsSlider.addEventListener("scroll", updateArrowVisibility);
    setTimeout(updateArrowVisibility, 100);

    // --- Close Button (now an 'X' icon) ---
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&#10006;"; // Unicode 'X' character
    closeBtn.className = "wishlist-close-btn"; // Add a class for specific styling
    closeBtn.style.cssText = `
    background: #ff4d4f; /* Still red for visibility */
    color: #fff;
    border: none;
    border-radius: 50%; /* Make it circular */
    width: 50px; /* Adjust size */
    height: 50px; /* Adjust size */
    font-size: 24px; /* Larger icon */
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.4s ease-in-out, background 0.2s ease-in-out;
    position: absolute;
    bottom: -70px; /* Start further down */
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
  `;
    closeBtn.onmouseenter = () => (closeBtn.style.background = "#ff2f31");
    closeBtn.onmouseleave = () => (closeBtn.style.background = "#ff4d4f");
    closeBtn.onclick = () => {
      closeBtn.style.transform = "translateX(-50%) translateY(70px)"; // Slide out further
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 400);
    };

    contentWrapper.appendChild(closeBtn);
    overlay.appendChild(contentWrapper);

    requestAnimationFrame(() => {
      closeBtn.style.transform = "translateX(-50%) translateY(0)";
      closeBtn.style.bottom = "20px"; // Final position
    });
  }
  window.WishlistHelpers = {
    injectWishlistToggleToHeader,
    createWishlistIcon,
    injectWishlistIcons,
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    const customerId =
      document.getElementById("customer-data")?.dataset.customerId;
    if (!customerId) {
      console.warn("⚠️ Customer ID not found in DOM");
      return;
    }

    window.loggedInCustomerId = customerId;

    const {
      createWishlistIcon,
      injectWishlistIcons,
      injectWishlistToggleToHeader,
    } = window.WishlistHelpers;

    injectWishlistIcons(document, customerId);
    injectWishlistToggleToHeader(customerId);

    // PDP page
    if (window.location.pathname.startsWith("/products/")) {
      const productData = document.getElementById("product-data");
      const productId = productData?.dataset.productId;

      if (productId) {
        const mainImage = document.querySelector(".product__media-wrapper img");
        const wrapper = mainImage?.closest(".product__media-wrapper");
        if (wrapper && !wrapper.querySelector(".wishlist-icon")) {
          wrapper.style.position = "relative";
          createWishlistIcon(productId, customerId).then((icon) => {
            wrapper.appendChild(icon);
          });
        }
      }
    }

    // Related products
    const related = document.querySelector("product-recommendations");
    if (related) {
      const observer = new MutationObserver(() => {
        if (
          related.classList.contains("product-recommendations--loaded") &&
          !related.querySelector(".wishlist-icon")
        ) {
          injectWishlistIcons(related, customerId);
        }
      });
      observer.observe(related, { childList: true, subtree: true });
    }
  }, 50);
});

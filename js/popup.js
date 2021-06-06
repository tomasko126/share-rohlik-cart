class Popup {
    static #SHARE_BTN_ID = 'generateLink';
    static #LIST_ID = 'list';
    static #LOADING_ID = 'loading';
    static #NO_PRODUCTS_IN_CART_ID = 'noproductsincart';
    static #SWITCH_TO_RIGHT_TAB_ID = 'switchtotab';
    static #COPIED_TO_CLIPBOARD_ID = 'copiedtoclipboard';

    static #popup = null;

    static getInstance() {
        if (!this.#popup) {
            this.#popup = new Popup();
        }

        return this.#popup;
    }

    /**
     * Initialize popup - handles fetching user's cart and showing up its content
     */
    init() {
        // Load cart content and display it
        chrome.runtime.sendMessage({ action: 'getCartContent' }, async (content) => {
            // Remove loading placeholder
            document.getElementById(Popup.#LOADING_ID).remove();

            // In this case, user is probably not on the right tab
            // Ask him to go to rohlik.cz site
            if (!content) {
                document.getElementById(Popup.#SWITCH_TO_RIGHT_TAB_ID).style.display = 'block';
                document.getElementById(Popup.#SHARE_BTN_ID).remove();
                return;
            }

            // Display all products in cart
            if (!this.#displayProducts(content)) {
                document.getElementById(Popup.#NO_PRODUCTS_IN_CART_ID).style.display = 'block';
                return;
            }

            // Retrieve share button
            const shareButton = document.getElementById(Popup.#SHARE_BTN_ID);

            // Attach click handler to the share button
            shareButton.onclick = async () => {
                await this.#generateLink();

                // Show message, that the link has been created and copied to user's clipboard
                const copiedToClipboardMessageElem = document.getElementById(Popup.#COPIED_TO_CLIPBOARD_ID);
                const shareButton = document.getElementById(Popup.#SHARE_BTN_ID);

                copiedToClipboardMessageElem.style.display = 'block';
                shareButton.style.display = 'none';

                // Let the message disappear in 5 secs
                setTimeout(() => {
                    copiedToClipboardMessageElem.style.display = 'none';
                    shareButton.style.display = 'block';
                }, 4000);
            }

            // Enable share button
            shareButton.removeAttribute("disabled");
        });
    }

    /**
     * Display all products in cart
     * @param {Array} data
     */
    #displayProducts(data) {
        if (Object.keys(data.items).length === 0) {
            return false;
        }

        for (const [productId, productData] of Object.entries(data?.items)) {
            this.#displayProduct(productId, productData);
        }

        return true;
    }

    /**
     * Retrieve only checked products
     */
    #retrieveSelectedProducts() {
        const selectedProducts = document.querySelectorAll('input:checked');

        const productsToShare = {};
        for (const product of selectedProducts) {
            const productId = product.id;
            const productQuantity = parseInt(document.getElementById(`${product.id}\-count`).value);

            productsToShare[productId] = productQuantity;
        }

        return JSON.stringify(productsToShare);
    }

    /**
     * Generate shareable link
     */
    async #generateLink() {
        const productsIds = this.#retrieveSelectedProducts();

        const urlToShare = new URL('https://rohlik.cz');
        urlToShare.searchParams.set('insertToCart', productsIds);

        await navigator.clipboard.writeText(urlToShare);
    }

    /**
     * Display a product
     * @param {Object} product
     */
    #displayProduct(productId, product) {
        const productElement = document.createElement("li");
        productElement.classList.add('product');
        productElement.innerHTML =
            `
            <span>
                <input type="checkbox" id="${productId}" name="${productId}" checked>
                <label for="${productId}" class="productname">${product?.productName}</label>
            </span>
            <span>
                <label for="${productId}-count">Count:</label>
                <input type="number" id="${productId}-count" name="${productId}-count" class="countinput" min="0" value="${product?.quantity}">
            </span>
        `

        document.getElementById(Popup.#LIST_ID).appendChild(productElement);
    }
}

Popup.getInstance().init();

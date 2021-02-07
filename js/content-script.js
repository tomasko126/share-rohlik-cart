class Cart {
    static #cart = null;
    static #ROHLIK_API_ENDPOINT = 'https://www.rohlik.cz/services/frontend-service/v2/cart';

    static getInstance() {
        if (!this.#cart) {
            this.#cart = new Cart();
        }

        return this.#cart;
    }

    // Retrieve products in cart by fetching the API
    async retrieveProductsInCart() {
        const response = await fetch(Cart.#ROHLIK_API_ENDPOINT);

        if (!response.ok) {
            throw new Error('Unable to load cart!');
        }

        const data = await response.json();

        return data?.data ?? [];
    }

    // Parse products and their quantity from URL
    parseProductsFromURL() {
        const url = new URL(location.href);

        // If no such parameter is in the URL, we do not have to continue further
        if (!url.searchParams.has('insertToCart')) {
            return false;
        }

        const products = url.searchParams.get('insertToCart');

        return JSON.parse(products);
    }

    // Add products to cart
    async addProductsToCart(products) {
        const promises = [];

        for (const [prodId, quantity] of Object.entries(products)) {
            const request = await fetch(Cart.#ROHLIK_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        "actionId": null,
                        "productId": prodId,
                        "quantity": parseInt(quantity),
                        "recipeId": null,
                    }
                )
            });

            promises.push(request);
        }

        await Promise.allSettled(promises);
    }

    // Delete appended parameter from URL and reload the page
    reloadPage() {
        const url = new URL(location.href);

        url.searchParams.delete('insertToCart');

        location.href = url.href;
    }
}

// Attach message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getCartContent') {
        // We have to wrap the await method in the anon. fn,
        // in order to have async messaging working
        (async () => {
            const products = await Cart.getInstance().retrieveProductsInCart();
            sendResponse(products);
        })();
    }

    return true;
});

// Onload handler
window.onload = async () => {
    const cart = Cart.getInstance();
    const products = cart.parseProductsFromURL();

    if (!products) {
        return;
    }

    // Add products to cart
    await cart.addProductsToCart(products);

    // Reload page
    await cart.reloadPage();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'generateLink') {
        // We have to wrap the await method in the anon. fn,
        // in order to have async messaging working
        (async () => {
            const link = await Cart.getInstance().generateCartLink();
            sendResponse(link);
        })();
    }

    return true;
});

class Cart {

    static #cart = null;
    static ROHLIK_URL = 'https://www.rohlik.cz/services/frontend-service/v2/cart';

    static getInstance() {
        if (!this.#cart) {
            this.#cart = new Cart();
        }

        return this.#cart;
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
            const request = await fetch(Cart.ROHLIK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        "productId": prodId,
                        "quantity": quantity,
                        "source": "true:Front:ProductPersonalSalesHP:default-product-basketForm",
                        "actionId": null,
                        "recipeId": null
                    }
                )
            });

            promises.push(request);
        }

        await Promise.allSettled(promises);
    }

    // Generate sharable cart link
    async generateCartLink() {
        const productIds = await this.retrieveItemsInCart();

        const urlToShare = new URL('https://rohlik.cz');
        urlToShare.searchParams.set('insertToCart', productIds);

        return decodeURIComponent(urlToShare);
    }

    // Retrieve items in cart by fetching the API
    async retrieveItemsInCart() {
        try {
            const response = await fetch(Cart.ROHLIK_URL);

            if (!response.ok) {
                throw new Error('Unable to load cart!');
            }

            const data = await response.json();

            // Object containing key -> value, where key is ID of the product and value its quantity
            const obj = {};
            for (const [key, value] of Object.entries(data?.data?.items)) {
                obj[key] = value.quantity;
            }

            return JSON.stringify(obj);
        } catch (e) {
            throw new Error(e);
        }
    }

    // Delete appended parameter from URL and reload the page
    reloadPage() {
        const url = new URL(location.href);

        url.searchParams.delete('insertToCart');

        location.href = url.href;
    }
}

// Onload handler
window.onload = async (e) => {
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getCartContent') {
        (async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                return;
            }

            chrome.tabs.sendMessage(tab.id, { action: 'getCartContent' }, (response) => {
                sendResponse(response);
            });
        })();
    }

    return true;
});

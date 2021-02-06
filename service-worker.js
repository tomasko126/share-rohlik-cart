chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'generateLink') {
        // We have to wrap the await method in the anon. fn,
        // in order to have async messaging working
        (async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                return;
            }

            chrome.tabs.sendMessage(tab.id, { action: 'generateLink' }, (response) => {
                sendResponse(response);
            });
        })();
    }

    return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'generateLink') {
        chrome.tabs.query({ active: true }, (tabs) => {
            if (!tabs.length) {
                return;
            }

            const tabId = tabs[0].id;

            chrome.tabs.sendMessage(tabId, { action: 'generateLink' }, (response) => {
                sendResponse(response);
            });
        });
    }

    return true;
});
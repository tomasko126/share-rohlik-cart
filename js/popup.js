const shareButton = document.getElementById('generateLink');

shareButton.onclick = (e) => {
    chrome.runtime.sendMessage({ action: 'generateLink' }, async (link) => {
        await navigator.clipboard.writeText(link);
        console.log('link has been copied to the clipboard!');
    });
}
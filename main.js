let tableBody

function onWindowLoad() {
    
    chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        if (new URL(activeTab.url).host != "nyaa.si")
            return;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            injectImmediately: true,  // uncomment this to make it execute straight away, other wise it will wait for document_idle
            func: DOMtoString,
            args: ['table[class*=torrent-list]']  // you can use this to target what element to get the html for
        });

    }).then(function (results) {
        if (results.length == 0)
            throw "Table not found"

        ToggleButtons(true)

        tableBody = document.createElement('div')
        tableBody.innerHTML = results[0].result;
        //ExtractLinks(results[0])
    }).catch(function (error) {
        console.log("Error loading torrents: " +  error)
    });

    document.getElementById("copyMagnetLinks").addEventListener('click', () => CopyMagnets())
    document.getElementById("copyLinks").addEventListener('click', () => CopyTorrents())
    document.getElementById("downloadLinks").addEventListener('click', () => DownloadTorrents())
}

window.onload = onWindowLoad;


function DOMtoString(selector) {
    if (selector) {
        selector = document.querySelector(selector);
        if (!selector) return "ERROR: querySelector failed to find node"
    } else {
        selector = document.documentElement;
    }

    return selector.outerHTML;
}

function CopyMagnets() {
    var links = ExtractLinks(true);
    navigator.clipboard.writeText(links.join('\n'))
}

function CopyTorrents() {
    var links = getTorrentLinks()

    navigator.clipboard.writeText(links.join('\n'))
}

function DownloadTorrents() {

    var links = getTorrentLinks();
    links.forEach(x => {
        var link = document.createElement('a')
        link.setAttribute('target', '_blank')
        link.setAttribute('href', x);
        link.click();
    })
}

function getTorrentLinks() {
    var links = ExtractLinks(false);
    var prefix = "https://nyaa.si";
    links = links.map(x => `${prefix}${x}`)

    return links
}

function ExtractLinks(magnet) {
    var rows = tableBody.querySelector('tbody').querySelectorAll('tr')

    var magnetLinks = []

    var index = 0;
    if (magnet) {
        index = 1;
    }

    for(let r=0; r<rows.length; r++) {
        var magnetLink = rows[r].querySelectorAll('td')[2].querySelectorAll('a')[index].outerHTML
        magnetLink = magnetLink.match(/href="([^"]*)/)[1];
        magnetLinks.push(magnetLink)
    }

    return magnetLinks
}

function ToggleButtons(state) {
    document.getElementById("copyMagnetLinks").disabled = !state
    document.getElementById("copyLinks").disabled = !state
    document.getElementById("downloadLinks").disabled = !state
}
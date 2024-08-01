var splitDomain = document.domain.split(".");
if (splitDomain.length > 1) {
    document.domain = splitDomain[splitDomain.length - 2] + "." + splitDomain[splitDomain.length - 1];
}

var flashingTimeout = null;

function isFlashing() {
    return flashingTimeout !== null;
}

function startFlashing() {
    if (isFlashing()) {
        return;
    }
    flashing = true;
    var b = [
        ["___BeliTalks___", "/static/favicon.png"],
        ["\xAF\xAF\xAFBeliTalks\xAF\xAF\xAF", "/static/altfavicon.png"]
    ];
    function a() {
        var c = b.pop();
        document.title = c[0];
        setFavicon(c[1]);
        b.unshift(c);
        flashingTimeout = setTimeout(a, 500);
    }
    a();
}

function stopFlashing() {
    if (!isFlashing()) {
        return;
    }
    clearTimeout(flashingTimeout);
    flashingTimeout = null;
    document.title = "BeliTalks";
    setFavicon("/static/favicon.png");
}

function setFavicon(a) {
    var link = document.querySelector("link[rel=icon]");
    if (link) {
        link.remove();
    }
    var b = document.createElement("link");
    b.rel = "icon";
    b.type = "image/png";
    b.href = a;
    document.head.appendChild(b);
}
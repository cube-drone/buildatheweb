var slugify = function(text){
    // Convert text into safe, ugly, lowercase text for use in URLs and ID tags
    return text.toString().toLowerCase()
        .replace('&amp;', 'and')        // Replace &amp; with and
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function debounce(func, wait, immediate) {
    // https://davidwalsh.name/javascript-debounce-function
    // A function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

var isChildOfClass = function(element, cssClass){
    // Returns 'true' if this element is a child of an element containing the cssClass
    var returnVal = false;
    $(element).parents().each(function(i, parent){
        var cls = $(parent).attr('class');
        if(cls != null){
            var classes = cls.split(" ");
            if(classes.indexOf(cssClass) !== -1){
                returnVal = true;
            }
        }
    });
    return returnVal;
};

var tableOfContentsSparseArray = new Array();
var tableOfContentsTree = new Arboreal();

var register = function(hLevel, i, element){
    // Add this element to the ToC data-structures

    element.id = slugify($(element).html());
    $(element).html($(element).html().trim());

    if(isChildOfClass(element, 'aside') || isChildOfClass(element, 'figure')){
        return;
    };
    var xheight = Math.round($(element).offset().top);

    tableOfContentsSparseArray[xheight] = {'level': hLevel, 'id':element.id,  'title': $(element).html()}

    //console.log(hLevel, i, $(element).html(), $(element).offset().top);
};

var addToTree = function(tocEntry){
    var level = tocEntry.level;

    let deepestChild = tableOfContentsTree;

    while(level > 1){
        if(deepestChild.children != null){
            deepestChild = deepestChild.children[deepestChild.children.length - 1];
        }
        level = level - 1;
    }
    deepestChild.appendChild(tocEntry);
}

var findInTree = function(element){
    return tableOfContentsTree.find(function(node){
        return node.data.id == element.id
    });
}


var closestElement = function(scrollPosition){
    // Find the closest Element to this scroll position.

    var closestElement = null;

    tableOfContentsSparseArray.forEach(function(el, i){
        if(i < scrollPosition){
            closestElement = el;
        }
    });

    return closestElement;
}

var renderHeader = function(treeObj){

    let htmlelements = "";
    let elements = new Array();

    //console.log(treeObj.depth);
    let currentObj = treeObj;

    for(var i = 0; i < treeObj.depth; i++){
        elements.push(currentObj.data);
        currentObj = currentObj.parent;
    }

    elements.reverse();

    let tocButton = $("<div class='tocbutton'>Table of Contents</div>")
    tocButton.click(function(){
        $("#toc-full").toggle();
    });

    let tocbar = $("<div class='tocshell'></div>");
    tocbar.append(tocButton);
    tocbar.append(elements.map(function(el){return `<a href='#${el.id}'>${el.title}</a>`}).join(" &gt; "));

    $("#toc-bar").html(tocbar);
}


$(document).ready(function(){
    $("#toc-bar").hide();
    $("#toc-full").hide();

    var hash = window.location.hash;
    window.location.hash = "";

    $("h1").each(function(i, el){ register(1, i, el); });
    $("h2").each(function(i, el){ register(2, i, el); });
    $("h3").each(function(i, el){ register(3, i, el); });
    $("h4").each(function(i, el){ register(4, i, el); });
    $("h5").each(function(i, el){ register(5, i, el); });
    $("h6").each(function(i, el){ register(6, i, el); });

    tableOfContentsSparseArray.forEach(function(el, i){
        //console.log(i, el);
        addToTree(el);
    });

    var tocHtmlArray = new Array();
    tableOfContentsTree.children[0].traverseDown(function(node){
        var depth = "", i;
        for (i = 1; i <= node.depth; i++) depth += "&mdash;";
        tocHtmlArray.push("\t<li>" + [depth, `<a href='#${node.data.id}'>${node.data.title}</a>`].join(" ") + "</li>");
    });

    var tocHtml = "<ul>" + tocHtmlArray.join("\n") + "</ul>";

    $("#toc-full").html(tocHtml);

    if(hash) {
        window.location.hash = hash;
    }
    $("#toc-bar").hide();
    $("#toc-full").hide();

    $("#content").click(hideToc);
});

var eventuallyFadeBackIn = debounce(function(){
    $("#toc-bar").slideDown();
}, 900);

var hideToc = debounce(function(){
    $("#toc-bar").fadeOut();
    $("#toc-full").fadeOut();
}, 10);

var generateLocation = debounce(function(){
    var scrollPosition = $(document).scrollTop();
    let closest = closestElement(scrollPosition+200);
    let treeObj = findInTree(closest);

    renderHeader(treeObj);

    eventuallyFadeBackIn();
}, 800);


$(document).scroll(function(){ hideToc(); generateLocation(); eventuallyFadeBackIn();  });

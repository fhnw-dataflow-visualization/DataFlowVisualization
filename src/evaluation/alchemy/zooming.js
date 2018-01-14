//Zooming START
var map = alchemy.map('map');
alert("test");
alchemy.map({
    initialScale: 0.5,
})

map.on('zoomed', function (e) {
    alert("test");
    zoom_based_layerchange();
})


map.getZoom = function () {
    initialScale: 0.5;
};

function zoom_based_layerchange() {
    var currentZoom = map.getZoom();
    switch (currentZoom) {
        case 1:
            nodes.caption;
            break;
        case 2:
            nodes[caption];
            break;
        case 3:
            nodes[caption];
            break;
        default:
            // do nothing
            break;
    }
}


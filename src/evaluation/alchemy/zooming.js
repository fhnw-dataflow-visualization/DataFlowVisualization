//Zooming START
var map = L.map('map').setView();

//Todo define "L"

}).addTo(map);

map.on('zoomend', function (e) {
    zoom_based_layerchange();
})
//Todo find out what to use instead of geoJson
var overviewlayer = L.geoJson(overview, {

    style: function (feature) {
        return feature.properties && feature.properties.style;
    },

    onEachFeature: onEachFeature
});

var detaillayer = L.geoJson(detail, {

    style: function (feature) {
        return feature.properties && feature.properties.style;
    },

    onEachFeature: onEachFeature
});

var filelayer = L.geoJson(file, {

    style: function (feature) {
        return feature.properties && feature.properties.style;
    },

    onEachFeature: onEachFeature
});


function clean_map() {
    map.eachLayer(function (layer) {
        if (layer instanceof L.GeoJSON)


        {
            map.removeLayer(layer);

        }
        //console.log(layer);


    });
}



function zoom_based_layerchange() {
    //console.log(map.getZoom());
    $("#zoomlevel").html(map.getZoom());
    var currentZoom = map.getZoom();
    switch (currentZoom) {
        case 1:
            clean_map();
            overviewlayer.addTo(map); //show whole graph
            break;
        case 2:
            clean_map();

            detaillayer.addTo(map); //show details
            break;
        case 3:
            clean_map();
            filelayer.addTo(map); // files in Nodes
            break;
        default:
            // do nothing
            break;
    }
}

//Zooming END

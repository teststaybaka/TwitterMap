google.maps.event.addDomListener(window, 'load', function() {
    var map = new google.maps.Map(document.getElementById("googleMap"), {
        zoom: 3,
        center: new google.maps.LatLng(51.508742, -0.120850),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    $.ajax({
        type: 'GET', 
        url: '/tweets',
        success: function(result) {
            // console.log(result);
            var tweets = result.tweets;
            var points = [];
            var markers = [];
            var iw = new google.maps.InfoWindow();
            var oms = new OverlappingMarkerSpiderfier(map);
            for (var i = 0; i < tweets.length; i++) {
                points.push(new google.maps.LatLng(tweets[i].latitude, tweets[i].longitude));
                var marker = new google.maps.Marker({
                    position: points[i],
                });
                marker.desc = render_content(tweets[i]);

                // marker.addListener('click', (function(marker) {
                //     return function() { 
                //         infowindow.setContent(marker.desc);
                //         infowindow.open(map, marker); 
                //     }
                // })(marker));
                markers.push(marker);
                oms.addMarker(marker);
            }
            oms.addListener('click', function(marker, event) {
                iw.setContent(marker.desc);
                iw.open(map, marker);
            });

            var markerCluster = new MarkerClusterer(map, markers, {ignoreHidden: true, gridSize: 50, maxZoom: 15});
            var heatmap = new google.maps.visualization.HeatmapLayer({
                data: points,
                map: map,
                opacity: 1,
            });

            $('.trigger-marker input').prop('checked', true);
            $('.trigger-marker input').change(function() {
                if ($(this).is(':checked')) {
                    markerCluster.addMarkers(markers, false);
                } else {
                    markerCluster.clearMarkers();
                }
            });

            if (result.histogram) {
                var histogram = result.histogram;
                var maximum = histogram[0][1];
                for (var i = 0; i < histogram.length; i++) {
                    var key = histogram[i][0];
                    var value = histogram[i][1];
                    $('.keywords-select').append('<option>'+key+'</option>');
                    $('.histogram-block').append('<div class="histogram-line">\
                                                    <div class="histogram-key">'+key+'</div>\
                                                    <div class="histogram-value">\
                                                        <div class="histogram-bar" style="width: '+value/maximum*100+'%;">'+value+'</div>\
                                                    </div>\
                                                </div>')
                }
            }

            var ws = new WebSocket("ws://" + window.location.hostname);
            ws.onopen = function (event) {
                console.log('WebSocket connected!');
            }
            ws.onmessage = function (event) {
                console.log(event.data);
            }
            ws.onerror = function(evt) {
                console.log('websocket error:'+evt)
            }

            $('.loading').addClass('hidden');
        },
    });
});

function render_content(tweet) {
    var div = '<div>\
                    <div class="map-marker-title">'+tweet.screen_name+':</div>\
                    <div class="map-marker-content">'+tweet.text+'</div>\
                    <div class="map-marker-time">'+tweet.created_at+'</div>\
                </div>';
    return div;
}
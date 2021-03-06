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
            oms.addListener('click', function(marker, event) {
                console.log('click');
                iw.setContent(marker.desc);
                iw.open(map, marker);
            });
            for (var i = 0; i < tweets.length; i++) {
                points.push(new google.maps.LatLng(tweets[i].latitude, tweets[i].longitude));
                var marker = new google.maps.Marker({
                    position: points[i],
                });
                marker.desc = render_content(tweets[i]);
                marker.text = tweets[i].text;
                marker.score = tweets[i].score;

                markers.push(marker);
                oms.addMarker(marker);
            }

            var clusterStyles = [
                {
                    textColor: 'black',
                    url: '/static/smile.png',
                    height: 40,
                    width: 40
                },
                {
                    textColor: 'black',
                    url: '/static/sad.png',
                    height: 40,
                    width: 40
                }
            ];
            var markerCluster = new MarkerClusterer(map, markers, {ignoreHidden: true, gridSize: 50, maxZoom: 15, styles: clusterStyles});
            markerCluster.setCalculator(function(markers, numStyles) {
                // var index = 0;
                // var count = markers.length;
                // var dv = count;
                // while (dv !== 0) {
                //     dv = parseInt(dv / 10, 10);
                //     index++;
                // }

                var accumulator = 0;
                for (var i = 0; i < markers.length; i++) {
                    accumulator += markers[i].score;
                }
                accumulator /= markers.length;

                var index;
                if (accumulator > 0) {
                    index = 1;
                } else {
                    index = 2;
                }
                // console.log(index);
                return {
                    text: Math.round(accumulator*1000)/1000,
                    index: index
                };
            });

            var heatmap = new google.maps.visualization.HeatmapLayer({
                data: points,
                map: map,
                opacity: 1,
                radius: 20,
            });

            $('.trigger.marker input').change(function() {
                if ($('.trigger.marker input').is(':checked')) {
                    markerCluster.addMarkers(markers, false);
                } else {
                    markerCluster.clearMarkers();
                }
            });

            var show_realtime = true;
            $('.trigger.new-tweets input').change(function() {
                if ($(this).is(':checked')) {
                    show_realtime = true;
                } else {
                    show_realtime = false;
                }
            });

            var ws = new WebSocket("ws://" + window.location.hostname);
            ws.onopen = function (event) {
                console.log('WebSocket connected!');
            }
            ws.onmessage = function (event) {
                var tweet = JSON.parse(event.data);
                var point = new google.maps.LatLng(tweet.latitude, tweet.longitude);
                points.push(point);
                var marker = new google.maps.Marker({
                    position: point,
                });
                marker.desc = render_content(tweet);
                marker.text = tweet.text;
                marker.score = tweet.score;

                markers.push(marker);
                markerCluster.addMarker(marker, false);
                oms.addMarker(marker);
                console.log(event.data);
                if (show_realtime) {
                    iw.setContent(marker.desc);
                    iw.setPosition(point);
                    iw.open(map);
                }
            }
            ws.onerror = function(evt) {
                console.log('websocket error:'+evt)
            }
            ws.onclose = function(evt) {
                console.log('WebSocket closed');
            }

            $('.loading').addClass('hidden');
            $('.histogram-bar').each(function() {
                $(this).width($(this).attr('data-width'));
            });
        },
    });
});

function render_content(tweet) {
    var div = '<div>\
                    <div class="map-marker-title">\
                        <a class="screen-name" target="_blank" href="https://twitter.com/'+tweet.screen_name+'">\
                            <img class="image-url" src="'
                            if (tweet.image_url) {
                                div += tweet.image_url;
                            } else {
                                div += '/static/default_profile.png';
                            }
                            div += '">\
                            <span class="screen-name">'+tweet.screen_name+':</span>\
                        </a>\
                    </div>\
                    <div class="map-marker-content">\
                        <span>'+tweet.text+'</span>\
                        <span class="sentiment '
                        if (tweet.score > 0) {
                            div += "positive"
                        } else {
                            div += "negative"
                        }
                        div += '">\
                            <span class="indicator"></span><span>'
                            if (tweet.score > 0) {
                                div += '+ '
                            } else {
                                div += '- '
                            }
                            div += Math.abs(Math.round(tweet.score*1000)/1000)+'</span>\
                        </span>\
                    </div>\
                    <div class="map-marker-time">'+tweet.created_at+'</div>\
                </div>';
    return div;
}

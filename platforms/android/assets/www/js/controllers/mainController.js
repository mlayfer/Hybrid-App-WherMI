'use strict';
/* Controllers */

appControllers.controller('mainCtrl', ['$scope',
    function ($scope) {
        //properties
        var apiKey = 'AIzaSyAaIW4kSBkI9GSLx1JlvnAeH42RuG4lMmQ';
        var instagramAccessToken = '39649736.1069844.417e726ff4f74278afc527f31d25acd6';
        $scope.distance = 200;
        $scope.currentPic = '';

        // Methods

        function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
            $("#loading").css("display", "block");
            var R = 6371; // Radius of the earth in km
            var dLat = deg2rad(lat2 - lat1);  // deg2rad below
            var dLon = deg2rad(lon2 - lon1);
            var a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c; // Distance in km
            $("#loading").css("display", "none");
            return d;
        };

        function deg2rad(deg) {
            return deg * (Math.PI / 180)
        };

        $scope.getLocation = function () {
            $("#loading").css("display", "block");
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition($scope.showPosition);
                $("#loading").css("display", "none");
            } else {
                console.log("Geolocation is not supported by this browser.");
                $("#loading").css("display", "none");
            }
        };

        $scope.showPosition = function (position) {
            $("#loading").css("display", "block");
            $scope.currentLng = position.coords.longitude;
            $scope.currentLat = position.coords.latitude;
            $.ajax({
                url: "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
                    + position.coords.latitude + "," + position.coords.longitude + "&radius=" + $scope.distance + "&language=iw&key=" + apiKey + "",
                type: "GET",
                success: function (data) {
                    $scope.places = data.results;

                    for (var i = 0; i < $scope.places.length; i++) {
                        $scope.places[i].distanceFromMe = Math.floor(1000 * getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, $scope.places[i].geometry.location.lat, $scope.places[i].geometry.location.lng));
                    }

                    $.ajax({
                        url: "https://he.wikipedia.org/w/api.php?action=query&format=json&prop=coordinates|pageimages|pageterms&generator=geosearch&colimit=500&piprop=thumbnail&pithumbsize=500&pilimit=50&wbptterms=description&ggscoord=" + position.coords.latitude + "|" + position.coords.longitude + "&ggsradius=" + $scope.distance + "&ggslimit=500",
                        type: "GET",
                        success: function (dataWiki) {
                            if (dataWiki.query) {
                                var count = Object.keys(dataWiki.query.pages).length;
                                var wikiPlaces = [];
                                for (var i = 0; i < count; i++) {
                                    wikiPlaces.push(dataWiki.query.pages[Object.keys(dataWiki.query.pages)[i]]);
                                }
                                for (var i = 0; i < wikiPlaces.length; i++) {
                                    for (var j = 0; j < $scope.places.length; j++) {
                                        var googleLat = '' + $scope.places[j].geometry.location.lat;
                                        var googleLng = '' + $scope.places[j].geometry.location.lng;
                                        var wikiLat = '' + wikiPlaces[i].coordinates[0].lat;
                                        var wikiLng = '' + wikiPlaces[i].coordinates[0].lng;
                                        if ((wikiPlaces[i].title == $scope.places[j].name) ||
                                            ((wikiLat.substring(0, 6) == googleLat.substring(0, 6)) &&
                                             (wikiLng.substring(0, 6) == googleLng.substring(0, 6)))) {
                                            console.log(wikiPlaces[i].title + '  ' + $scope.places[j].name + ' MATCH!');
                                            delete wikiPlaces[i]; i++;
                                            $scope.places[j].isWiki = true;
                                        }
                                    }
                                }
                                for (var i = 0; i < wikiPlaces.length; i++) {
                                    if (wikiPlaces[i]) {
                                        var dist = Math.floor(1000 * getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, wikiPlaces[i].coordinates[0].lat, wikiPlaces[i].coordinates[0].lon));
                                        $scope.places[$scope.places.length] = {
                                            distanceFromMe: dist,
                                            name: wikiPlaces[i].title,
                                            types: 'wiki',
                                            geometry: {
                                                location: {
                                                    lat: wikiPlaces[i].coordinates[0].lat,
                                                    lng: wikiPlaces[i].coordinates[0].lon
                                                }
                                            },
                                            photosWiki: wikiPlaces[i].thumbnail.source
                                        }
                                    }
                                }

                                $.ajax({
                                    url: "https://api.instagram.com/v1/locations/search?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude + "&distance=" + $scope.distance + "&access_token=" + instagramAccessToken + "",
                                    dataType: 'jsonp',
                                    success: function (dataInst) {
                                        console.log(dataInst);
                                        if (dataInst.data) {
                                            var instPlaces = dataInst.data;
                                            console.log(instPlaces);
                                            for (var i = 0; i < $scope.places.length; i++) {
                                                for (var j = 0; j < instPlaces.length; j++) {
                                                    var googleLat = '' + $scope.places[i].geometry.location.lat; var instagramLat = '' + instPlaces[j].latitude;
                                                    var googleLng = '' + $scope.places[i].geometry.location.lng; var instagramLng = '' + instPlaces[j].longitude;
                                                    if ((googleLat.substring(0, 6)) == (instagramLat.substring(0, 6)) && (googleLng.substring(0, 6)) == (instagramLng.substring(0, 6))) {
                                                        console.log($scope.places[i].name + ' = ' + instPlaces[j].name);
                                                        $scope.places[i].instagramID = instPlaces[j].id;
                                                    }
                                                }
                                            }

                                            for (var i = 0; i < instPlaces.length; i++) {
                                                var dist = Math.floor(1000 * getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, instPlaces[i].latitude, instPlaces[i].longitude));
                                                if (instPlaces[i] && (dist <= $scope.distance)) {
                                                    $scope.places[$scope.places.length] = {
                                                        distanceFromMe: dist,
                                                        name: instPlaces[i].name,
                                                        types: 'instagram',
                                                        geometry: {
                                                            location: {
                                                                lat: instPlaces[i].latitude,
                                                                lng: instPlaces[i].longitude
                                                            }
                                                        },
                                                        instId: instPlaces[i].id
                                                    }
                                                }
                                            }
                                            $scope.$apply();
                                        } dataInst
                                    }
                                });

                            }
                        }
                    });
                    if ($scope.places[0]) {
                        $scope.getDetails($scope.places[0]);
                    } else if ($scope.distance <= 200) {
                        $scope.distance = 500;
                        $scope.getLocation();
                    } else if ($scope.distance <= 500) {
                        $scope.distance = 1000;
                        $scope.getLocation();
                    } else if ($scope.distance <= 1000) {
                        $scope.distance = 2000;
                        $scope.getLocation();
                    } else if ($scope.distance <= 2000) {
                        $scope.distance = 5000;
                        $scope.getLocation();
                    } else {
                        $("#loading").css("display", "none");
                        alert('לא נמצאו מקומות בסביבה הקרובה');
                    }
                }
            });
        };

        $scope.getDetails = function (place) {
            $("#loading").css("display", "block");
            var distance = Math.floor(1000 * getDistanceFromLatLonInKm($scope.currentLat, $scope.currentLng, place.geometry.location.lat, place.geometry.location.lng));
            if (distance > 1000) {
                var dis = "" + distance / 1000;
                $scope.distanceFromMe = dis.substring(0, 3) + ' ק"מ';
            } else {
                $scope.distanceFromMe = distance + ' מ\'';
            }
            if (place.instId) {
                $("#loading").css("display", "block");
                var getMediaUrl = "https://api.instagram.com/v1/locations/" + place.instId + "/media/recent?&access_token=" + instagramAccessToken + "";
                $.ajax({
                    url: getMediaUrl,
                    dataType: 'jsonp',
                    success: function (data) {
                        var instPhotosArray = [];
                        $scope.instPhotos = {};
                        console.log(data.data[0]);
                        if (data.data[0]) {
                            for (var i = 0; i < data.data.length; i++) {
                                var imageData = data.data[i];
                                instPhotosArray.push(imageData);
                                $scope.instPhotos[i] = {
                                    url: '',
                                    userName: '',
                                    userPic: '',
                                    userLink: ''
                                }
                                $scope.instPhotos[i].url = instPhotosArray[i].images.low_resolution.url;
                                $scope.instPhotos[i].userName = instPhotosArray[i].user.username;
                                $scope.instPhotos[i].userPic = instPhotosArray[i].user.profile_picture;
                                $scope.instPhotos[i].userLink = instPhotosArray[i].link;
                                console.log($scope.instPhotos);
                            }
                        }
                        $scope.$apply();
                    }
                });
            }

            $scope.wikiData = ''; $scope.cretirea = ''; $scope.images = ''; $scope.instPhotos = '';
            $scope.getDataFromWiki(place.name);
            if (place.place_id) {
                $.ajax({
                    url: "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + place.place_id + "&language=iw&key=" + apiKey + "",
                    type: "GET",
                    success: function (data) {
                        $scope.placeDetails = data;
                        console.log($scope.placeDetails);
                        for (var i = 0; i < $scope.placeDetails.result.types.length; i++) {
                            $scope.cretirea += $scope.placeDetails.result.types[i];
                            if ($scope.placeDetails.result.types[i + 1]) $scope.cretirea += ', ';
                        }
                        if ($scope.placeDetails.result.opening_hours) {
                            if ($scope.placeDetails.result.opening_hours.open_now == true) {
                                $scope.isOpen = 'פתוח עכשיו';
                                document.getElementById("isOpen").style.color = "white";
                                document.getElementById("isOpen").style.background = "forestgreen";
                            } else {
                                $scope.isOpen = 'סגור';
                                document.getElementById("isOpen").style.color = "white";
                                document.getElementById("isOpen").style.background = "red";
                            }
                        }

                        var imagesArray = [];
                        $scope.images = {};
                        console.log($scope.placeDetails.result.photos.length);
                        console.log($scope.images.length);
                        if ($scope.placeDetails.result.photos == 0) $scope.images[0] = 'images/defaultPageImage.jpg';
                        console.log($scope.images);

                        if ($scope.placeDetails.result.photos || place.isWiki) {
                            if ($scope.placeDetails.result.photos) {
                                for (var i = 0; i < $scope.placeDetails.result.photos.length; i++) {
                                    var image = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=" + data.result.photos[i].photo_reference + "&key=" + apiKey + "";
                                    imagesArray.push(image);
                                    $scope.images[i] = imagesArray[i];
                                }
                            }
                            if (place.isWiki) {
                                $.ajax({
                                    url: "https://he.wikipedia.org/w/api.php?action=query&titles=" + place.name + "&prop=images&format=json",
                                    type: "GET",
                                    success: function (data) {
                                        if (data.query.pages[Object.keys(data.query.pages)[0]].images) {
                                            var imagesArray = [];
                                            for (var i = 0; i < data.query.pages[Object.keys(data.query.pages)[0]].images.length; i++) {
                                                var currentImage = data.query.pages[Object.keys(data.query.pages)[0]].images[i].title;
                                                if ((currentImage != "קובץ:Commons-logo.svg") && (currentImage != "קובץ:Green globe.svg") && (currentImage != "קובץ:Red Point 12 New.gif")) {
                                                    console.log(currentImage);
                                                    $.ajax({
                                                        url: "https://he.wikipedia.org/w/api.php?action=query&titles=" + currentImage + "&prop=imageinfo&&iiprop=url&iiurlwidth=200&format=json",
                                                        type: "GET",
                                                        success: function (dataForImage) {
                                                            if (dataForImage.query.pages[-1]) {
                                                                var image = dataForImage.query.pages[-1].imageinfo[0].thumburl;
                                                                imagesArray.push(image)
                                                                for (var m = 0; m < imagesArray.length; m++) {
                                                                    $scope.images[$scope.placeDetails.result.photos.length + m] = imagesArray[m];
                                                                }
                                                                $scope.$apply();
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        }
                        $("#loading").css("display", "none");
                    }
                });
            } else {
                $.ajax({
                    url: "https://he.wikipedia.org/w/api.php?action=query&titles=" + place.name + "&prop=images&format=json",
                    type: "GET",
                    success: function (data) {
                        if (data.query.pages[Object.keys(data.query.pages)[0]].images) {
                            var imagesArray = [];
                            $scope.images = {};
                            for (var i = 0; i < data.query.pages[Object.keys(data.query.pages)[0]].images.length; i++) {
                                var currentImage = data.query.pages[Object.keys(data.query.pages)[0]].images[i].title;
                                if ((currentImage != "קובץ:Commons-logo.svg") && (currentImage != "קובץ:Green globe.svg") && (currentImage != "קובץ:Red Point 12 New.gif")) {
                                    console.log(currentImage);
                                    $.ajax({
                                        url: "https://he.wikipedia.org/w/api.php?action=query&titles=" + currentImage + "&prop=imageinfo&&iiprop=url&iiurlwidth=200&format=json",
                                        type: "GET",
                                        success: function (dataForImage) {
                                            if (dataForImage.query.pages[-1]) {
                                                console.log(dataForImage.query.pages[-1].imageinfo[0]);
                                                var image = dataForImage.query.pages[-1].imageinfo[0].thumburl;
                                                imagesArray.push(image)
                                                $scope.images = {};
                                                for (var m = 0; m < imagesArray.length; m++) {
                                                    $scope.images[m] = imagesArray[m];
                                                }
                                                $scope.$apply();
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
                $scope.placeDetails = {
                    result: {
                        name: place.name
                    }
                };
            }
            $("#loading").css("display", "none");
        };

        $scope.arrangeMin = function (time) {
            $("#loading").css("display", "block");
            if (time) {
                var minutes = time.substring(2, 4);
                if ((parseInt(minutes) < 10) && (parseInt(minutes) || 0)) minutes = "0" + minutes;
                $("#loading").css("display", "none");
                return minutes;
            }
            $("#loading").css("display", "none");
            return;
        };

        $scope.arrangeHour = function (time) {
            $("#loading").css("display", "block");
            if (time) {
                var hours = time.substring(0, 2);
                $("#loading").css("display", "none");
                return hours;
            }
            $("#loading").css("display", "none");
            return;
        };

        function onSuccess(result) { console.log("Success:" + result); };
        function onError(result) { console.log("Error:" + result); };
        $scope.callNumber = function (phone) {
            window.plugins.CallNumber.callNumber(onSuccess, onError, phone, false);
        };

        $scope.setPic = function (pic) {
            $scope.currentPic = pic;
        };

        $scope.formatWebsite = function (website) {
            if (website) {
                var extractedHTTP = website.substring(7);
                extractedHTTP = extractedHTTP.slice(0, -1);
                if (extractedHTTP.length > 80) extractedHTTP = extractedHTTP.substring(0, 55) + '...';
                return extractedHTTP;
            }
            return;
        };

        $scope.getDataFromWiki = function (name) {
            $("#loading").css("display", "block");
            $.ajax({
                url: "https://he.wikipedia.org/w/api.php?action=query&llinlanguagecode=iw&prop=extracts&format=json&exintro=&titles=" + name,
                type: "GET",
                success: function (data) {
                    if (data.query.pages[Object.keys(data.query.pages)[0]]) $scope.wikiData = data.query.pages[Object.keys(data.query.pages)[0]].extract;
                    $scope.$apply();
                    $("#loading").css("display", "none");
                }
            });
        };

        $scope.getDate = function (num) {
            $("#loading").css("display", "block");
            var a = new Date(num * 1000);
            var year = a.getFullYear();
            var month = a.getMonth() + 1;
            var hour = a.getHours();
            var min = a.getMinutes();
            var time = hour + ':' + min + ' ' + month + '/' + year;
            $("#loading").css("display", "none");
            return time;
        };

        $scope.drawStars = function (num) {
            return new Array(num);
        };

        $scope.updateIcon = function (icon, types) {
            if ((types[0] == 'parking') || (types[0] == 'gas_station') || (types[0] == 'car_repair') || (types[0] == 'car_dealer') || (types[0] == 'car_rental') || (types[0] == 'car_wash')) {
                return '<i class="fa fa-car" aria-hidden="true"></i>';
            } else if ((types[0] == 'school') || (types[0] == 'university')) {
                return '<i class="fa fa-graduation-cap" aria-hidden="true"></i>';
            } else if (types[0] == 'neighborhood') {
                return '<i class="fa fa-home" aria-hidden="true"</i>';
            } else if ((types[0] == 'health') || (types[0] == 'gym')) {
                return '<i class="fa fa-heartbeat" aria-hidden="true"</i>';
            } else if (types[0] == 'shopping_mall') {
                return '<i class="fa fa-shopping-bag" aria-hidden="true"</i>';
            } else if (types[0] == 'post_office') {
                return '<i class="fa fa-envelope-o" aria-hidden="true"</i>';
            } else if (types[0] == 'lodging') {
                return '<i class="fa fa-bed  " aria-hidden="true"</i>';
            } else if (types[0] == 'aquarium') {
                return '<i class="fa fa-ship" aria-hidden="true"</i>';
            } else if (types[0] == 'subway_station') {
                return '<i class="fa fa-subway" aria-hidden="true"</i>';
            } else if ((types[0] == 'bowling_alley') || (types[0] == 'casino')) {
                return '<i class="fa fa-gamepad" aria-hidden="true"</i>';
            } else if (types[0] == 'campground') {
                return '<i class="fa fa-fighter-jet" aria-hidden="true"</i>';
            } else if ((types[0] == 'restaurant') || (types[0] == 'food') || (types[0] == 'meal_delivery') || (types[0] == 'meal_takeaway') || (types[0] == 'bakery')) {
                return '<i class="fa fa-cutlery" aria-hidden="true"</i>';
            } else if (types[0] == 'art_gallery') {
                return '<i class="fa fa-picture-o" aria-hidden="true"</i>';
            } else if (types[0] == 'liquor_store') {
                return '<i class="fa fa-glass" aria-hidden="true"</i>';
            } else if ((types[0] == 'veterinary_care') || (types[0] == 'pet_store') || (types[0] == 'zoo')) {
                return '<i class="fa fa-paw" aria-hidden="true"</i>';
            } else if (types[0] == 'bicycle_store') {
                return '<i class="fa fa-bicycle" aria-hidden="true"</i>';
            } else if ((types[0] == 'lawyer') || (types[0] == 'courthouse')) {
                return '<i class="fa fa-gavel" aria-hidden="true"</i>';
            } else if (types[0] == 'jewelry_store') {
                return '<i class="fa fa-diamond" aria-hidden="true"</i>';
            } else if (types[0] == 'taxi_stand') {
                return '<i class="fa fa-taxi" aria-hidden="true"</i>';
            } else if ((types[0] == 'doctor') || (types[0] == 'dentist') || (types[0] == 'physiotherapist')) {
                return '<i class="fa fa-user-md" aria-hidden="true"</i>';
            } else if (types[0] == 'train_station') {
                return '<i class="fa fa-train" aria-hidden="true"</i>';
            } else if (types[0] == 'painter') {
                return '<i class="fa fa-paint-brush" aria-hidden="true"</i>';
            } else if ((types[0] == 'book_store') || (types[0] == 'library')) {
                return '<i class="fa fa-book" aria-hidden="true"</i>';
            } else if (types[0] == 'electronics_store') {
                return '<i class="fa fa-plug" aria-hidden="true"</i>';
            } else if ((types[0] == 'locality') || (types[0] == 'sublocality') || (types[0] == 'sublocality_level_1') || (types[0] == 'sublocality_level_2') || (types[0] == 'sublocality_level_3') || (types[0] == 'sublocality_level_4') || (types[0] == 'sublocality_level_5')) {
                return '<i class="fa fa-building" aria-hidden="true"</i>';
            } else if (types[0] == 'bus_station') {
                return '<i class="fa fa-bus" aria-hidden="true"</i>';
            } else if (types[0] == 'florist') {
                return '<i class="fa fa-bus" aria-hidden="true"</i>';
            } else if (types[0] == 'country') {
                return '<i class="fa fa-flag" aria-hidden="true"</i>';
            } else if ((types[0] == 'park') || (types[0] == 'rv_park') || (types[0] == 'cemetery')) {
                return '<i class="fa fa-tree" aria-hidden="true"</i>';
            } else if ((types[0] == 'bank') || (types[0] == 'accounting') || (types[0] == 'atm') || (types[0] == 'finance')) {
                return '<i class="fa fa-money" aria-hidden="true"</i>';
            } else if (types[0] == 'bar') {
                return '<i class="fa fa-beer" aria-hidden="true"</i>';
            } else if (types[0] == 'beauty_salon') {
                return '<i class="fa fa-female" aria-hidden="true"</i>';
            } else if (types[0] == 'cafe') {
                return '<i class="fa fa-coffee" aria-hidden="true"</i>';
            } else if ((types[0] == 'pharmacy') || (types[0] == 'hospital')) {
                return '<i class="fa fa-medkit" aria-hidden="true"</i>';
            } else if (types[0] == 'stadium') {
                return '<i class="fa fa-futbol-o" aria-hidden="true"</i>';
            } else if (types[0] == 'spa') {
                return '<i class="fa fa-tint" aria-hidden="true"</i>';
            } else if ((types[0] == 'premise') || (types[0] == 'subpremise')) {
                return '<i class="fa fa-binoculars" aria-hidden="true"</i>';
            } else if ((types[0] == 'movie_theater') || (types[0] == 'movie_rental')) {
                return '<i class="fa fa-film" aria-hidden="true"</i>';
            } else if ((types[0] == 'travel_agency') || (types[0] == 'airport')) {
                return '<i class="fa fa-plane" aria-hidden="true"</i>';
            } else if ((types[0] == 'city_hall') || (types[0] == 'local_government_office') || (types[0] == 'museum') || (types[0] == 'embassy')) {
                return '<i class="fa fa-university" aria-hidden="true"</i>';
            } else if (types[0] == 'moving_company') {
                return '<i class="fa fa-truck" aria-hidden="true"</i>';
            } else if (types[0] == 'amusement_park') {
                return '<i class="fa fa-themeisle" aria-hidden="true"</i>';
            } else if ((types[0] == 'plumber') || (types[0] == 'electrician')) {
                return '<i class="fa fa-wrench" aria-hidden="true"</i>';
            } else if (types[0] == 'fire_station') {
                return '<i class="fa fa-fire-extinguisher" aria-hidden="true"</i>';
            } else if ((types[0] == 'home_goods_store') || (types[0] == 'furniture_store') || (types[0] == 'department_store') || (types[0] == 'convenience_store') || (types[0] == 'hardware_store') || (types[0] == 'grocery_or_supermarket') || (types[0] == 'shoe_store') || (types[0] == 'store') || (types[0] == 'grocery_or_supermarket') || (types[0] == 'clothing_store')) {
                return '<i class="fa fa-shopping-cart" aria-hidden="true"</i>';
            } else if (types == 'wiki') {
                return '<i class="fa fa-wikipedia-w" aria-hidden="true"</i>';
            } else if (types == 'instagram') {
                return '<i class="fa fa-instagram" aria-hidden="true"</i>';
            }
            return '<i class="fa fa-map-marker" aria-hidden="true"</i>';
        };

        $scope.tabName = function (name) {
            if (name.length > 20) return name.substring(0, 18) + '..';
            else return name;
        };

        $scope.openSettings = function () {
            $('#settings').modal({
                show: true
            });
        };

        $scope.addReview = function (id) {
            var myURL = encodeURI('https://plus.google.com/_/widget/render/localreview?placeid=' + id);;
            var ref = window.open(myURL, '_blank', 'location=yes');;
        };

        $scope.onLoad = function () {
            document.addEventListener("deviceready", onDeviceReady, false);
            admob.requestInterstitialAd({ publisherId: "ca-app-pub-3635941250247073", interstitialAdId: "ca-app-pub-3635941250247073~2566246265" });
        };


        function onDeviceReady() {
            $(document).ready(function () {
                $("#loading").css("display", "block");
                $scope.getLocation();
                $("#changeDistance").change(function () {
                    $scope.distance = $("#changeDistance").val();
                    $scope.getLocation();
                    $('#myModal').modal('hide');
                    $("#loading").css("display", "none");
                })
            });
        };

        $scope.selectAll = function (event) {
            if (this.checked) {
                $(':checkbox').each(function () {
                    this.checked = true;
                });
            } else {
                $(':checkbox').each(function () {
                    this.checked = false;
                });
            }
        };

        // Back handlers
        $scope.back = function (ev) {
            backPressed();
        };
        $scope.$on('backbutton', function () {
            backPressed();
        });
        function backPressed() {
            navigator.app.exitApp();
        }
        // Back handlers end

    }]);
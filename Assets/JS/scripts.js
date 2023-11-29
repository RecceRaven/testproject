const apiKey = 'Qa1GPNTaSHDXPoOVWz3hB4EsUiaQlKKH';
const endpoint = 'https://app.ticketmaster.com/discovery/v2/events.json';
const mapboxAccessToken = 'pk.eyJ1IjoiandhdHNvbmNvZGVzIiwiYSI6ImNscGhoNzdmMTAyNjUycW9oYjhjcjN6ZmMifQ.5dF1EeA8M509DfFEV1Uf6g';

mapboxgl.accessToken = mapboxAccessToken;

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-96, 37.8],
            zoom: 3
        });

        $(document).ready(function () {
            $('#search-form').submit(function (event) {
                event.preventDefault();
                const city = $('#search-input').val();
                const artist = $('#artist-input').val();
                searchConcerts(city, artist);
            });
        });

        function searchConcerts(city, artist) {
            let url = `${endpoint}?apikey=${apiKey}&city=${city}`;
            
            if (artist) {
                // Include artist in the search if provided
                url += `&keyword=${artist}`;
            }

            $.ajax({
                url: url,
                type: 'GET',
                success: function (response) {
                    displayConcerts(response);
                    displayOnMap(response);
                },
                error: function (error) {
                    console.error('Error fetching concerts:', error);
                }
            });
        }

        function displayConcerts(response) {
            const resultsContainer = $('#concert-results');
            resultsContainer.empty();

            if (response._embedded && response._embedded.events && response._embedded.events.length > 0) {
                const events = response._embedded.events;
                events.forEach(event => {
                    const eventName = event.name;
                    const eventDate = new Date(event.dates.start.localDate).toLocaleDateString();
                    const venue = event._embedded.venues[0].name;
                    const eventHtml = `<div>
                        <h2>${eventName}</h2>
                        <p>Date: ${eventDate}</p>
                        <p>Venue: ${venue}</p>
                    </div>`;
                    resultsContainer.append(eventHtml);
                });
            } else {
                resultsContainer.html('<p>No concerts found</p>');
            }
        }

        function displayOnMap(response) {
            const locations = [];

            if (response._embedded && response._embedded.events && response._embedded.events.length > 0) {
                const events = response._embedded.events;
                events.forEach(event => {
                    const venue = event._embedded.venues[0];
                    if (venue && venue.location && venue.location.longitude && venue.location.latitude) {
                        const coordinates = [venue.location.longitude, venue.location.latitude];
                        locations.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: coordinates
                            },
                            properties: {
                                title: event.name,
                                description: venue.name
                            }
                        });
                    }
                });
            }

            // Add markers to the map
            locations.forEach(location => {
                new mapboxgl.Marker()
                    .setLngLat(location.geometry.coordinates)
                    .setPopup(new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<h3>${location.properties.title}</h3><p>${location.properties.description}</p>`))
                    .addTo(map);
            });

            // Fit the map to the bounds of the markers
            if (locations.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                locations.forEach(location => {
                    bounds.extend(location.geometry.coordinates);
                });
                map.fitBounds(bounds, { padding: 50 });
            }
        }
       
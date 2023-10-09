// Define an array of GeoJSON file URLs in the desired order
const geojsonUrls = [
  './static/flensburg_stadtteile.geojson',
  './static/flensburg_public_transport_route.geojson',
  './static/flensburg_public_transport_platform.geojson'
];

// Variable to keep track of the currently clicked layer
let currentClickedLayer = null;

const circleMarkers = [];
const geojsonLayers = [];

const style1 = {
  fillColor: '#011936',
  color: '#011936',
  weight: 1,
  opacity: .7,
};

const style2 = {
  color: '#0564d9',
  weight: 2,
  opacity: 1,
};

const style3 = {
};

// Define different pointToLayer functions with an index parameter
const pointToLayerFunctions = [
  (feature, latlng, index) => {
    latlng.on('click', function (e) {
      console.log('0')
    })
  },
  (feature, latlng, index) => {
    latlng.on('click', function (e) {
      console.log('1')
    })
  },
  (feature, latlng, index) => {
    // Custom pointToLayer logic for the third GeoJSON layer
    const circleMarker = L.circleMarker(latlng, { radius: 3, color: '#db055e', fillColor: '#db055e', fill: true, fillOpacity: 1 });
    const busNumbers = ''

    // Add a tooltip to the CircleMarker
    circleMarker.bindTooltip(`${feature.properties.name}, Bus ${busNumbers}`);

    // Add an onClick event handler to each CircleMarker
    circleMarker.on('click', function (e) {
      // Center the map on the CircleMarker's location
      map.setView(latlng, 15);

      // Trigger click events on CircleMarkers in previous GeoJSON layers
      console.log(index)
      console.log(e.layer)
      console.log(geojsonLayers[index - 1])
      geojsonLayers[index - 2].fire('click')
    });

    return circleMarker;
  },
];

// Define different onEachFeature functions with an index parameter
const onEachFeatureFunctions = [
  (feature, layer, index) => {
          // Add a click event handler for each layer
          layer.on('click', function () {
            // Check if there was a previously clicked layer
            if (currentClickedLayer) {
              // Reset the fill color of the previously clicked layer
              currentClickedLayer.setStyle({ fillColor: '#011936' });
            }

            // Set the fill color of the clicked layer
            layer.setStyle({ fillColor: 'yellow' });

            // Update the currently clicked layer
            currentClickedLayer = layer;
          });
  },
  (feature, layer, index) => {
    // Custom logic for the second GeoJSON layer with index = 1
  },
  (feature, layer, index) => {
    // Custom logic for the third GeoJSON layer with index = 2
  },
];

const styles = [style1, style2, style3];

// Initialize map
const map = L.map('map', {
  maxZoom: 19
}).setView([54.7836, 9.4121], 13)

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

// Create an array of promises for fetching GeoJSON data
const promises = geojsonUrls.map((url, index) =>
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      let geojsonLayer

      if (index === geojsonUrls.length - 1) {
        geojsonLayer = L.geoJSON(data, {
          pointToLayer: (feature, latlng) => {
            // Call the corresponding pointToLayer function with the index parameter
            return pointToLayerFunctions[index](feature, latlng, index);
          },
          onEachFeature: (feature, layer) => {
            // Call the corresponding onEachFeature function with the index parameter
            onEachFeatureFunctions[index](feature, layer, index);
          },
        });
      } else {
        // For other layers, use the default onEachFeature function
        geojsonLayer = L.geoJSON(data, {
          style: styles[index],
          onEachFeature: (feature, layer) => {
            // Call the corresponding onEachFeature function with the index parameter
            onEachFeatureFunctions[index](feature, layer, index);
          },
        });
      }

      // Store the GeoJSON layer in the geojsonLayers array
      geojsonLayers.push(geojsonLayer);

      return geojsonLayer;
    })
);

// Define a click event handler
function handleLayerClick(event) {
  // Perform your custom action here, using event properties
  console.log('Click event:', event);

  // Example: Change the style of the clicked layer
  event.target.setStyle({ fillColor: 'red' });
}

// Use Promise.all to wait for all promises to resolve
Promise.all(promises)
 .then((layers) => {
    layers[0].addTo(map)
    layers[1].addTo(map)
    layers[2].addTo(map)

    // Calculate the bounds based on all GeoJSON layers
    const bounds = L.featureGroup(layers).getBounds();

    // Fit the map to the calculated bounds
    map.fitBounds(bounds);

    // Create a LayerGroup and add your layers to it
    const layerGroup = L.layerGroup(...layers);

    // Add a click event listener to the LayerGroup
    layerGroup.on('click', handleLayerClick);
  })
  .catch((error) => {
    console.error('Error fetching GeoJSON data:', error);
  });
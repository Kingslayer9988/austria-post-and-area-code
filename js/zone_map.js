/**
 * zone_map.js
 * Provides visualization of Austrian postal codes by zone and delivery area (Gebiet)
 */

var ZoneMap = {
  // Store the zone and gebiet data
  zoneData: null,
  gebietData: null,
  plzToZoneMap: null,
  currentMode: 'zone', // 'zone' or 'gebiet'
  currentLayer: null, // Store the current layer for easy removal
  
  // Initialize the map with zone data
  initZoneMap: function() {
    console.log('Initializing Zone Map...');
    
    // Remove current layer if it exists
    if (this.currentLayer) {
      map.removeLayer(this.currentLayer);
    }
    
    // Load the necessary data files
    var self = this;
    Promise.all([
      fetch('data/nos_plz_to_zone.json').then(response => response.json()),
      fetch('data/nos_zones.json').then(response => response.json())
    ]).then(function(results) {
      var plzToZoneMap = results[0];
      var zoneData = results[1];
      
      self.plzToZoneMap = plzToZoneMap;
      self.zoneData = zoneData.zones;
      self.gebietData = zoneData.gebiet;
      
      console.log('Zone data loaded successfully');
      
      // Initialize the map with zone visualization
      self.renderMap();
    }).catch(function(error) {
      console.error('Error loading zone data:', error);
    });
  },
  
  // Switch between zone and gebiet visualization
  setMode: function(mode) {
    console.log('Switching to ' + mode + ' mode');
    this.currentMode = mode;
    this.renderMap();
  },
  
  // Render the map with the current mode
  renderMap: function() {
    if (!this.plzToZoneMap || !this.zoneData || !this.gebietData) {
      console.error("Zone data not loaded yet");
      return;
    }
    
    // Remove current layer if it exists
    if (this.currentLayer) {
      map.removeLayer(this.currentLayer);
    }
    
    if (this.currentMode === 'zone') {
      this.renderZoneMap();
    } else {
      this.renderGebietMap();
    }
  },
  
  // Render the map colored by zones
  renderZoneMap: function() {
    var self = this;
    console.log("Rendering zone map");
    
    // Load the GeoJSON data
    fetch("data/vorwahlen+plz.json")
      .then(function(response) {
        return response.json();
      })
      .then(function(geoJsonData) {
        // Create a new layer with zone coloring
        var zoneLayer = L.geoJSON(geoJsonData, {
          style: function(feature) {
            // Get the postal code
            if (feature.properties && feature.properties.plz) {
              // Find the first PLZ in the feature
              var plzKeys = Object.keys(feature.properties.plz);
              if (plzKeys.length > 0) {
                var plz = plzKeys[0];
                // If we have zone information for this postal code
                if (self.plzToZoneMap[plz]) {
                  var zone = self.plzToZoneMap[plz];
                  return {
                    fillColor: self.zoneData[zone].color,
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                  };
                }
              }
            }
            // Default style if no zone data
            return {
              fillColor: '#cccccc',
              weight: 1,
              opacity: 1,
              color: 'white',
              fillOpacity: 0.3
            };
          },
          onEachFeature: function(feature, layer) {
            // Add popup with zone information
            if (feature.properties && feature.properties.plz) {
              var plzKeys = Object.keys(feature.properties.plz);
              if (plzKeys.length > 0) {
                var plz = plzKeys[0];
                if (self.plzToZoneMap[plz]) {
                  var zone = self.plzToZoneMap[plz];
                  layer.bindPopup("<b>PLZ " + plz + "</b><br>Zone " + zone + ": " + self.zoneData[zone].name);
                }
              }
            }
          }
        });
        
        // Store the current layer
        self.currentLayer = zoneLayer;
        
        // Add to map
        zoneLayer.addTo(map);
        
        // Update the legend
        self.updateZoneLegend();
      })
      .catch(function(error) {
        console.error("Error loading GeoJSON data:", error);
      });
  },
  
  // Render the map colored by delivery areas (Gebiete)
  renderGebietMap: function() {
    var self = this;
    console.log("Rendering gebiet map");
    
    // Load the GeoJSON data
    fetch("data/vorwahlen+plz.json")
      .then(function(response) {
        return response.json();
      })
      .then(function(geoJsonData) {
        // Create a new layer with gebiet coloring
        var gebietLayer = L.geoJSON(geoJsonData, {
          style: function(feature) {
            // Get the postal code
            if (feature.properties && feature.properties.plz) {
              // Find the first PLZ in the feature
              var plzKeys = Object.keys(feature.properties.plz);
              if (plzKeys.length > 0) {
                var plz = plzKeys[0];
                // If we have zone information for this postal code
                if (self.plzToZoneMap[plz]) {
                  var zone = self.plzToZoneMap[plz];
                  var gebietId = self.zoneData[zone].gebiet;
                  return {
                    fillColor: self.gebietData[gebietId].color,
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                  };
                }
              }
            }
            // Default style if no zone data
            return {
              fillColor: '#cccccc',
              weight: 1,
              opacity: 1,
              color: 'white',
              fillOpacity: 0.3
            };
          },
          onEachFeature: function(feature, layer) {
            // Add popup with gebiet information
            if (feature.properties && feature.properties.plz) {
              var plzKeys = Object.keys(feature.properties.plz);
              if (plzKeys.length > 0) {
                var plz = plzKeys[0];
                if (self.plzToZoneMap[plz]) {
                  var zone = self.plzToZoneMap[plz];
                  var gebietId = self.zoneData[zone].gebiet;
                  layer.bindPopup("<b>PLZ " + plz + "</b><br>" + self.gebietData[gebietId].name);
                }
              }
            }
          }
        });
        
        // Store the current layer
        self.currentLayer = gebietLayer;
        
        // Add to map
        gebietLayer.addTo(map);
        
        // Update the legend
        self.updateGebietLegend();
      })
      .catch(function(error) {
        console.error("Error loading GeoJSON data:", error);
      });
  },
  
  // Update the legend with zone information
  updateZoneLegend: function() {
    var legendContainer = document.getElementById('map-legend');
    if (!legendContainer) {
      console.error("Legend container not found");
      return;
    }
    
    legendContainer.innerHTML = ""; // Clear existing legend
    
    // Add title
    var title = document.createElement('h5');
    title.textContent = "Zonen";
    legendContainer.appendChild(title);
    
    // Create legend items for each zone
    var zones = Object.keys(this.zoneData).sort();
    for (var i = 0; i < zones.length; i++) {
      var zone = zones[i];
      var data = this.zoneData[zone];
      
      var item = document.createElement('div');
      item.className = 'legend-item';
      
      var colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = data.color;
      
      var label = document.createElement('div');
      label.className = 'legend-label';
      label.textContent = "Zone " + zone + ": " + data.name;
      
      item.appendChild(colorBox);
      item.appendChild(label);
      legendContainer.appendChild(item);
    }
  },
  
  // Update the legend with gebiet information
  updateGebietLegend: function() {
    var legendContainer = document.getElementById('map-legend');
    if (!legendContainer) {
      console.error("Legend container not found");
      return;
    }
    
    legendContainer.innerHTML = ""; // Clear existing legend
    
    // Add title
    var title = document.createElement('h5');
    title.textContent = "Liefergebiete NOS";
    legendContainer.appendChild(title);
    
    // Create legend items for each delivery area
    var gebietIds = Object.keys(this.gebietData).sort();
    for (var i = 0; i < gebietIds.length; i++) {
      var gebietId = gebietIds[i];
      var data = this.gebietData[gebietId];
      
      var item = document.createElement('div');
      item.className = 'legend-item';
      
      var colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = data.color;
      
      var label = document.createElement('div');
      label.className = 'legend-label';
      label.textContent = data.name;
      
      item.appendChild(colorBox);
      item.appendChild(label);
      legendContainer.appendChild(item);
    }
  }
};

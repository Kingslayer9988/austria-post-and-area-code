//**
 * zone_map.js
 * Provides visualization of Austrian postal codes by zone and delivery area (Gebiet)
 * To be used with the Austria Post and Area Code repository
 */

const ZoneMap = {
  // Store the zone and gebiet data
  zoneData: null,
  gebietData: null,
  plzToZoneMap: null,
  currentMode: 'zone', // 'zone' or 'gebiet'
  
  // Initialize the map with zone data
  initZoneMap: function() {
    console.log('Initializing Zone Map...');
    
    // Load the necessary data files
    Promise.all([
      fetch('data/nos_plz_to_zone.json').then(response => response.json()),
      fetch('data/nos_zones.json').then(response => response.json())
    ]).then(([plzToZoneMap, zoneData]) => {
      this.plzToZoneMap = plzToZoneMap;
      this.zoneData = zoneData.zones;
      this.gebietData = zoneData.gebiet;
      
      // Initialize the map with zone visualization
      this.renderMap();
      
      console.log('Zone Map initialized');
    }).catch(error => {
      console.error('Error loading zone data:', error);
    });
  },
  
  // Switch between zone and gebiet visualization
  setMode: function(mode) {
    console.log(`Switching to ${mode} mode`);
    this.currentMode = mode;
    this.renderMap();
  },
  
  // Render the map with the current mode
  renderMap: function() {
    if (!this.plzToZoneMap || !this.zoneData || !this.gebietData) {
      console.error("Zone data not loaded yet");
      return;
    }
    
    console.log("Rendering map with mode:", this.currentMode);
    
    if (this.currentMode === 'zone') {
      this.renderZoneMap();
    } else {
      this.renderGebietMap();
    }
  },
  
  // Render the map colored by zones
  renderZoneMap: function() {
    const self = this;
    console.log("Rendering zone map");
    
    // We need to create a GeoJSON layer with our zone data
    // First we need to get the existing GeoJSON data
    fetch("data/vorwahlen+plz.json")
      .then(response => response.json())
      .then(geoJsonData => {
        // Create a new GeoJSON layer with our zone coloring
        const zoneLayer = L.geoJSON(geoJsonData, {
          style: function(feature) {
            // Get the postal code
            if (feature.properties && feature.properties.plz) {
              // Find the first PLZ in the feature
              const plzKeys = Object.keys(feature.properties.plz);
              if (plzKeys.length > 0) {
                const plz = plzKeys[0];
                // If we have zone information for this postal code
                if (self.plzToZoneMap[plz]) {
                  const zone = self.plzToZoneMap[plz];
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
              const plzKeys = Object.keys(feature.properties.plz);
              if (plzKeys.length > 0) {
                const plz = plzKeys[0];
                if (self.plzToZoneMap[plz]) {
                  const zone = self.plzToZoneMap[plz];
                  layer.bindPopup(`<b>PLZ ${plz}</b><br>Zone ${zone}: ${self.zoneData[zone].name}`);
                }
              }
            }
          }
        });
        
        // Add to map
        zoneLayer.addTo(map);
        
        // Update the legend
        this.updateZoneLegend();
      })
      .catch(error => {
        console.error("Error loading GeoJSON data:", error);
      });
  },
  
  // Render the map colored by delivery areas (Gebiete)
  renderGebietMap: function() {
    const self = this;
    console.log("Rendering gebiet map");
    
    // Similar to renderZoneMap but with Gebiet coloring
    fetch("data/vorwahlen+plz.json")
      .then(response => response.json())
      .then(geoJsonData => {
        // Create a new GeoJSON layer with our gebiet coloring
        const gebietLayer = L.geoJSON(geoJsonData, {
          style: function(feature) {
            // Get the postal code
            if (feature.properties && feature.properties.plz) {
              // Find the first PLZ in the feature
              const plzKeys = Object.keys(feature.properties.plz);
              if (plzKeys.length > 0) {
                const plz = plzKeys[0];
                // If we have zone information for this postal code
                if (self.plzToZoneMap[plz]) {
                  const zone = self.plzToZoneMap[plz];
                  const gebietId = self.zoneData[zone].gebiet;
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
              const plzKeys = Object.keys(feature.properties.plz);
              if (plzKeys.length > 0) {
                const plz = plzKeys[0];
                if (self.plzToZoneMap[plz]) {
                  const zone = self.plzToZoneMap[plz];
                  const gebietId = self.zoneData[zone].gebiet;
                  layer.bindPopup(`<b>PLZ ${plz}</b><br>${self.gebietData[gebietId].name}`);
                }
              }
            }
          }
        });
        
        // Add to map
        gebietLayer.addTo(map);
        
        // Update the legend
        this.updateGebietLegend();
      })
      .catch(error => {
        console.error("Error loading GeoJSON data:", error);
      });
  },
  
  // Update the legend with zone information
  updateZoneLegend: function() {
    const legendContainer = document.getElementById('map-legend');
    legendContainer.innerHTML = ""; // Clear existing legend
    
    // Add title
    const title = document.createElement('h5');
    title.textContent = "Zonen";
    legendContainer.appendChild(title);
    
    // Create legend items for each zone
    Object.entries(this.zoneData).sort().forEach(([zone, data]) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      
      const colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = data.color;
      
      const label = document.createElement('div');
      label.className = 'legend-label';
      label.textContent = `Zone ${zone}: ${data.name}`;
      
      item.appendChild(colorBox);
      item.appendChild(label);
      legendContainer.appendChild(item);
    });
  },
  
  // Update the legend with gebiet information
  updateGebietLegend: function() {
    const legendContainer = document.getElementById('map-legend');
    legendContainer.innerHTML = ""; // Clear existing legend
    
    // Add title
    const title = document.createElement('h5');
    title.textContent = "Liefergebiete NOS";
    legendContainer.appendChild(title);
    
    // Create legend items for each delivery area
    Object.entries(this.gebietData).sort().forEach(([gebietId, data]) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      
      const colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = data.color;
      
      const label = document.createElement('div');
      label.className = 'legend-label';
      label.textContent = data.name;
      
      item.appendChild(colorBox);
      item.appendChild(label);
      legendContainer.appendChild(item);
    });
  },
  
  // Handle hover events for postal code areas
  handleHover: function(feature, isHover) {
    if (!feature || !feature.properties) return;
    
    // Get the postal code
    if (feature.properties.plz) {
      const plzKeys = Object.keys(feature.properties.plz);
      if (plzKeys.length > 0) {
        const plz = plzKeys[0];
        
        // Show information in an info box if one exists
        if (document.getElementById('info-box')) {
          const zone = this.plzToZoneMap[plz];
          const gebietId = zone ? this.zoneData[zone].gebiet : null;
          
          let infoContent = `<strong>PLZ: ${plz}</strong><br>`;
          
          if (zone) {
            infoContent += `Zone: ${zone} - ${this.zoneData[zone].name}<br>`;
            infoContent += `Liefergebiet: ${this.gebietData[gebietId].name}`;
          } else {
            infoContent += "Keine Zoneninformation verfügbar";
          }
          
          document.getElementById('info-box').innerHTML = infoContent;
          document.getElementById('info-box').style.display = isHover ? 'block' : 'none';
        }
      }
    }
  }
};

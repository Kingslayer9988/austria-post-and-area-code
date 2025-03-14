/**
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
      
      // Initialize tooltips (assuming Bootstrap is used for tooltips)
      $('[data-toggle="tooltip"]').tooltip();
      
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
    // Clear any existing colors
    d3.selectAll("path.plz").style("fill", "#ffffff");
    
    if (this.currentMode === 'zone') {
      this.renderZoneMap();
    } else {
      this.renderGebietMap();
    }
  },
  
  // Render the map colored by zones
  renderZoneMap: function() {
    const self = this;
    
    // For each postal code area in the map
    d3.selectAll("path.plz").each(function() {
      const path = d3.select(this);
      const plz = path.attr("id").replace("plz-", "");
      
      // If we have zone information for this postal code
      if (self.plzToZoneMap[plz]) {
        const zone = self.plzToZoneMap[plz];
        const color = self.zoneData[zone].color;
        
        // Set the fill color and add a tooltip
        path.style("fill", color)
            .attr("data-toggle", "tooltip")
            .attr("title", `PLZ ${plz}: Zone ${zone} - ${self.zoneData[zone].name}`);
      }
    });
    
    // Update the legend
    this.updateZoneLegend();
  },
  
  // Render the map colored by delivery areas (Gebiete)
  renderGebietMap: function() {
    const self = this;
    
    // For each postal code area in the map
    d3.selectAll("path.plz").each(function() {
      const path = d3.select(this);
      const plz = path.attr("id").replace("plz-", "");
      
      // If we have zone information for this postal code
      if (self.plzToZoneMap[plz]) {
        const zone = self.plzToZoneMap[plz];
        const gebietId = self.zoneData[zone].gebiet;
        const color = self.gebietData[gebietId].color;
        
        // Set the fill color and add a tooltip
        path.style("fill", color)
            .attr("data-toggle", "tooltip")
            .attr("title", `PLZ ${plz}: ${self.gebietData[gebietId].name}`);
      }
    });
    
    // Update the legend
    this.updateGebietLegend();
  },
  
  // Update the legend with zone information
  updateZoneLegend: function() {
    const legendContainer = d3.select("#map-legend");
    legendContainer.html(""); // Clear existing legend
    
    // Add title
    legendContainer.append("h5").text("Zonen");
    
    // Create legend items for each zone
    Object.entries(this.zoneData).sort().forEach(([zone, data]) => {
      const item = legendContainer.append("div").attr("class", "legend-item");
      
      item.append("div")
        .attr("class", "legend-color")
        .style("background-color", data.color);
        
      item.append("div")
        .attr("class", "legend-label")
        .text(`Zone ${zone}: ${data.name}`);
    });
  },
  
  // Update the legend with gebiet information
  updateGebietLegend: function() {
    const legendContainer = d3.select("#map-legend");
    legendContainer.html(""); // Clear existing legend
    
    // Add title
    legendContainer.append("h5").text("Liefergebiete NOS");
    
    // Create legend items for each delivery area
    Object.entries(this.gebietData).sort().forEach(([gebietId, data]) => {
      const item = legendContainer.append("div").attr("class", "legend-item");
      
      item.append("div")
        .attr("class", "legend-color")
        .style("background-color", data.color);
        
      item.append("div")
        .attr("class", "legend-label")
        .text(data.name);
    });
  },
  
  // Handle hover events for postal code areas
  handleHover: function(path, isHover) {
    const plz = path.attr("id").replace("plz-", "");
    
    if (isHover) {
      // Highlight on hover
      path.style("stroke-width", "2")
          .style("stroke", "#000");
          
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
      }
    } else {
      // Reset on mouse out
      path.style("stroke-width", "0.5")
          .style("stroke", "#ccc");
    }
  }
};

// Export the ZoneMap object if using ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZoneMap };
}

function loadMap (options) {
  var url = (options == undefined) ? "/providers/" : "/providers/county/" + options.county + "/service/" + options.service;

  if (options !== undefined) {
    map.off();
    map.remove();  
  }
  
  map = L.map('mapDiv').setView([45.9432, 24.9668], 7);
  
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  geojsonLayer = new L.GeoJSON.AJAX(url,{
      onEachFeature: function(feature, layer) {
          var popupText = "<b>" + feature.properties.name + "</b>"
              + "<br>Adresa: " + feature.properties.address 
              + ", " + feature.properties.city
              + ", Județul " + feature.properties.county;
          layer.bindPopup(popupText); 
      }
  });       
  geojsonLayer.addTo(map);
}

$(document).ready(function() {
  	  var map, geojsonLayer;   
      
      //Load default Map
      loadMap();
      $('#Filter').on('click', function(event) {
        event.preventDefault(); // To prevent following the link (optional)

          //Add form filter to Get params and reload Map

          var county = ($("#county").val().length > 0) ? $("#county").val() : '-';
          console.log(county);
          
          loadMap({
            "county": ($("#county").val().length > 0) ? $("#county").val() : '-', 
            "service": ($("#service").val().length > 0) ? $("#service").val() : '-', 
          });

          //Close modal
          $('#FiltersModal').modal('hide');
      });      
});
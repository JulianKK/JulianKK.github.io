const leafletObject = {home: [47.72191016016923, 16.042789546032154]}

const load = () => {
    leafletObject.map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafletObject.map);

    L.marker(leafletObject.home, {icon: houseIcon}).addTo(leafletObject.map);

    fetch("meine.gpx")
  .then((res) => res.text())
  .then((text) => { 
    new L.GPX(text, {async: true}).on('loaded', function(e) {
      leafletObject.map.fitBounds(e.target.getBounds());
        console.log(e)
        console.log(text)
        console.log(res)
      }).addTo(leafletObject.map);
   })
  .catch((e) => console.error(e));

}

const fly = (location) => {
  leafletObject.map.flyTo(leafletObject[location], 15)
}



const houseIcon = L.icon({
  iconUrl: './style/img/house.png',

  iconSize:     [38, 38], // size of the icon
  iconAnchor:   [37, 37]
});
const leafletObject = {
  home: [47.72191016016923, 16.042789546032154]
}

const load = () => {
  leafletObject.map = L.map('map').setView(leafletObject.home, 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(leafletObject.map);

  L.marker(leafletObject.home, { icon: houseIcon }).addTo(leafletObject.map);

  initTracks()
  console.log(leafletObject)
}

const initTracks = () => {
  fetch("./gpx/tracks.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error
          (`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      leafletObject.tracks = data
      readTracks("./gpx/hike/", leafletObject.tracks.hike)
      readTracks("./gpx/bike/", leafletObject.tracks.bike)
      readTracks("./gpx/climb/", leafletObject.tracks.climb)
    })
    .catch((error) =>
      console.error("Unable to fetch data:", error));
}

const readTracks = (path, tracks, img) => {
  tracks.forEach(track => {
    fetch(path + track.name + ".gpx")
      .then((res) => res.text())
      .then((text) => {
        track["track"] = new L.GPX(text, {
          async: true,
          marker_options: {
            startIconUrl: './style/img/pin-icon-start.png',
            endIconUrl: './style/img/pin-icon-end.png',
            shadowUrl: './style/img/pin-shadow.png'
          }
        })
        track["track"].addTo(leafletObject.map)
      })
      .catch((e) => console.error(e));
  })
}




const fly = (location) => {
  leafletObject.map.flyTo(leafletObject[location], 15)
}

const flyToBoarder = (border) => {
  const bounds = new L.LatLngBounds(border._northEast, border._southWest)
  leafletObject.map.flyToBounds(bounds)
}

const canvasShow = (type) => {
  document.getElementById('offcanvasExampleLabel').textContent = type.toUpperCase();
  document.getElementById("routes").innerHTML = ""
  routes.innerHTML = ""
  const newRoutes = { "helper": "" }
  type === "all" 
  ? ["hike", "bike", "climb"].forEach(part => createTracklist(newRoutes, part))
  : createTracklist(newRoutes, type)
  
  document.getElementById("routes").innerHTML += newRoutes["helper"]
}

createTracklist= (newRoutes, type) => {
  leafletObject.tracks[type].forEach(element => {
    const bounds = element.track.getBounds()
    console.log(bounds)
    
    newRoutes["helper"] += "<tr onClick=canvasCloseAndFly('" + JSON.stringify(bounds) +"')>" +
      "<td>" + element.name + "</td>" +
      "<td>" +
      new Date(element.track.get_total_time()).toUTCString().match("..:..")[0] +
      "</td>" +
      "<td>" + "<span class='fa-solid fa-star checked'></span>".repeat(element.stars) + "</td>" +
        "</tr>"
  })
}

const canvasCloseAndFly = (bounds) => {
  console.log(bounds)
  bootstrap.Offcanvas.getInstance(offcanvasExample).hide();
  flyToBoarder(JSON.parse(bounds))
}



const houseIcon = L.icon({
  iconUrl: './style/img/house.png',

  iconSize: [38, 38], // size of the icon
  iconAnchor: [37, 37]
});
const leafletObject = {
  home: [47.72191016016923, 16.042789546032154]
}

const load = () => {
  const osMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  })

  const googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  });

  var thunderForest = L.tileLayer('https://{s}.tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey={apikey}', {
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    apikey: 'eb705312dff74a4ba9be9b97ec898203',
    maxZoom: 22
  });

  const googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  });

  leafletObject.map = L.map('map', { center: leafletObject.home, zoom: 13, zoomControl: false })

  L.marker(leafletObject.home, { icon: houseIcon }).addTo(leafletObject.map);

  leafletObject.baseMaps = {
    "osMap": osMap,
    "googleSatelite": googleSat,
    "thunderForest": thunderForest,
    "googleHybrid": googleHybrid,
  }

  leafletObject.map.on("click", (e) => {
    trackClicked(null)
  })
  osMap.addTo(leafletObject.map)
  L.control.layers(leafletObject.baseMaps).addTo(leafletObject.map)
  L.control.scale({ position: 'topleft' }).addTo(leafletObject.map);
  L.control.measure({ position: 'topleft' }).addTo(leafletObject.map);
  initTracks()
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
          }, polyline_options: { color: 'darkblue' }
        })
        track["track"].addTo(leafletObject.map)
        track["track"].bindPopup(createPopup(track))
        track["track"].on("click", (e) => {
          trackClicked(track["track"])
        })
      })
      .catch((e) => console.error(e))
  })
}

const trackInfo = (track) => {

  const myModal = document.getElementById('myModal')
  document.getElementById('exampleModalLabel').textContent = track.name.toUpperCase()

  document.getElementById("distance").textContent = (track.track.get_distance() / 1000.0).toFixed(3) + " km"
  document.getElementById("time").textContent = new Date(track.track.get_total_time()).toUTCString().match("..:..")[0] + " h"
  document.getElementById("gain").textContent = track.track.get_elevation_gain().toFixed(0) + " m"
  document.getElementById("description").textContent = track.description
  document.getElementById("rating").innerHTML = "<span class='fa-solid fa-star checked'></span>".repeat(track.stars)

  createImgView(track.name)

  new bootstrap.Modal(myModal).toggle()
  const ctx = document.getElementById('myChart');
  const hohe = track["track"].get_elevation_data()
  if (leafletObject.chart != null) {
    leafletObject.chart.destroy()
  }
  leafletObject.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: hohe.length }).map((e, idx) => `${idx}`),
      datasets: [
        {
          label: 'Höhenprofil',
          data: hohe,
          // borderColor: Utils.CHART_COLORS.red,
          // backgroundColor: Utils.transparentize(Utils.CHART_COLORS.red),
          fill: true
        }
      ]
    }, options: {
      //Boolean - Whether the line is curved between points
      bezierCurve: true,
      scales: {
        y: {

          ticks: {
            callback: function (value, index, ticks) {
              return value + " m"
            }
          }
        },
        x: {
          ticks: {
            callback: function (value, index, ticks) {
              const max = Math.max(...ticks.map(thing => thing.value))
              const norm = value / max
              return (norm * (track.track.get_distance() / 1000.0)).toFixed(1) + " km"
            }
          }
        }
      }
    }
  });

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
  const routes = document.getElementById("routes")
  routes.innerHTML = ""
  const newRoutes = { "helper": routes }
  type === "all"
    ? ["hike", "bike", "climb"].forEach(part => createTracklist(newRoutes, part))
    : createTracklist(newRoutes, type)


}

createTracklist = (newRoutes, type) => {
  leafletObject.tracks[type].forEach(element => {
    const tr = document.createElement("tr");
    tr.onclick = function () {
      canvasCloseAndFly(element.track)
      trackClicked(element.track)
    }
    tr.innerHTML = "<td>" + element.name.toUpperCase() + "</td>" +
      "<td>" +
      new Date(element.track.get_total_time()).toUTCString().match("..:..")[0] +
      "</td>" +
      "<td>" + "<span class='fa-solid fa-star checked'></span>".repeat(element.stars) + "</td>" +
      "</tr>"

    newRoutes["helper"].appendChild(tr)

  })
}

const canvasCloseAndFly = (track) => {
  bootstrap.Offcanvas.getInstance(offcanvasExample).hide();
  flyToBoarder(track.getBounds())
}




const houseIcon = L.icon({
  iconUrl: './style/img/house.png',

  iconSize: [38, 38], // size of the icon
  iconAnchor: [37, 37]
});

const createImgView = (name) => {
  document.getElementById("img1").src = './style/img/tour/' + name + '/img1.jpeg'
  document.getElementById("img2").src = './style/img/tour/' + name + '/img2.jpeg'
  document.getElementById("img3").src = './style/img/tour/' + name + '/img3.jpeg'

  document.getElementById("himg1").href = './style/img/tour/' + name + '/img1.jpeg'
  document.getElementById("himg2").href = './style/img/tour/' + name + '/img2.jpeg'
  document.getElementById("himg3").href = './style/img/tour/' + name + '/img3.jpeg'
}

const trackClicked = (track) => {
  if (leafletObject["selected"] != null)
    leafletObject["selected"].setStyle({
      color: 'darkblue'
    });

  track && track.setStyle({
    color: 'blue'
  });

  leafletObject["selected"] = track
}

const createPopup = (element) => {
  const button = document.createElement("button");
  button.innerHTML = "Zeige Infos";
  button.className = "btn btn-primary"

  button.onclick = function () {
    trackInfo(element)
  }
  return button
}
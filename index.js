import _, { lowerCase } from 'lodash'
import $ from 'jquery'
// import CryptoJS from 'crypto-js'

//const OSD_baseUrl = "https://lab-mi.trial.opendatasoft.com/api/records/1.0/search/?"
//const OSD_apiKey = process.env.OSD_API_KEY
// Format json opendatasoft
// { "records": [ { "fields": { "dep": 930, "com": 001 }, ] }

const OSD_baseUrl = "https://api-baac.herokuapp.com/caracteristiques?"
// Format json api-baac
// [ { "dep": 930, "com": 001, }, ]

// API key for Open Street Map via Mapbox
const OSM_apiKey = process.env.OSM_API_KEY

$('#button').on('click', () => {
    let villes = $('#villes')
    villes.empty()
    $("#accidents").empty()

    // initialisation du tableau
    let dataTable = document.createElement('table')
    dataTable.className = "table table-striped table-sm"
    let tableHead = document.createElement('thead')
    tableHead.className = "thead-dark"
    dataTable.appendChild(tableHead)
    let header = document.createElement('tr')
    let colHeader = document.createElement('th')
    colHeader.scope = "col"
    colHeader.innerHTML = "ville"
    header.appendChild(colHeader)
    colHeader = document.createElement('th')
    colHeader.scope = "col"
    colHeader.innerHTML = "nb accidents"
    header.appendChild(colHeader)
    tableHead.appendChild(header)

    const departement = $('#departement').val()
    // const request = `dataset=caracteristiques-2018&rows=10000&apikey=${OSD_apiKey}&q=dep%3D${departement}0`
    const request = `_limit=10000&dep=${departement}0`
    fetch(OSD_baseUrl+request, {
        method: "GET",
    })
    .then(response => response.json())
    .then(json => {
        let communes = []
        json.forEach(element => {
            if(!communes.find(el => el.codeCommune === element.com)){
                communes.push({
                    "codeCommune": element.com,
                    "nbAccidents": 1
                })
            } else {
                for (let i = 0; i < communes.length; i++) {
                    if (communes[i].codeCommune === element.com) {
                        communes[i].nbAccidents += 1
                    }
                }
            }
        })
        return communes
    })
    .then(communes => {
        communes.forEach(commune => {
            fetch(`https://geo.api.gouv.fr/communes/${departement}${commune.codeCommune}?fields=nom,code,centre,contour&format=json&geometry=centre`)
            .then(response => response.json())
            .then(json => {
                const nomVille = json.nom
                const nbAccidents = commune.nbAccidents

                let trVille = document.createElement('tr')
                trVille.onclick = () => {
                    getListAccident(commune.codeCommune, nomVille, json.centre, json.contour)
                }
                let tdVille = document.createElement('td')
                tdVille.innerHTML = nomVille
                let tdNbAcc = document.createElement('td')
                tdNbAcc.style = "text-align: center"
                tdNbAcc.innerHTML = nbAccidents
                trVille.appendChild(tdVille)
                trVille.appendChild(tdNbAcc)
                dataTable.appendChild(trVille)
            })
        })
        villes.append(dataTable)
    })
    .catch((err) => {
        console.log(err)
    })
})

const getListAccident = (codeCommune, ville, mapCenter, contourVille) => {
    let accidents = $('#accidents')
    accidents.empty()
    let nomVille = $('#nomVille')
    nomVille.empty()
    let townTitle = document.createElement('h2')
    townTitle.innerHTML = `${ville}`
    nomVille.append(townTitle)

    // initialisation du tableau
    let dataTable = document.createElement('table')
    dataTable.className = "table table-striped table-sm"
    let tableHead = document.createElement('thead')
    tableHead.className = "thead-dark"
    dataTable.appendChild(tableHead)
    let header = document.createElement('tr')
    let colHeader = document.createElement('th')
    colHeader.scope = "col"
    colHeader.innerHTML = "date/heure"
    header.appendChild(colHeader)
    colHeader = document.createElement('th')
    colHeader.scope = "col"
    colHeader.innerHTML = "GPS"
    header.appendChild(colHeader)
    tableHead.appendChild(header)

    const departement = $('#departement').val()
    // const request = `dataset=caracteristiques-2018&rows=10000&apikey=${OSD_apiKey}&q=dep%3D${departement}0+com%3D${codeCommune}`
    const request = `_limit=10000&dep=${departement}0&com=${codeCommune}`
    fetch(OSD_baseUrl+request, {
        method: "GET",
    })
    .then(response => response.json())
    .then(json => {
        json.forEach(element => {
            let jour, mois, heure, minute
            const an = element.an
            let hrmn = `${element.hrmn}`
            let lat, long
            
            if (element.jour < 10) {
                jour = `0${element.jour}`
            } else {
                jour = element.jour
            }
            if (element.mois < 10) {
                mois = `0${element.mois}`
            } else {
                mois = element.mois
            }
            if (element.hrmn < 1000) {
                hrmn = `0${hrmn}`
            } 
            heure = hrmn.slice(0, 2)
            minute = hrmn.slice(2, 4)
            
            if (element.lat) {
                lat = `${element.lat}`
                lat = `${lat.slice(0, 2)}.${lat.slice(2, lat.length)}`
            } else {
                lat = '-'
            }
            
            if (element.long) {
                long = `${element.long}`
                long = `${long.slice(0, 2)}.${long.slice(2, long.length)}`
            } else {
                long = '-'
            }

            let trAccident = document.createElement('tr')
            let tdDate = document.createElement('td')
            tdDate.innerHTML = `${jour}-${mois}-20${an} / ${heure}h${minute}`
            let tdGPS = document.createElement('td')

            const googleMapLink = "https://www.google.com/maps/search/?api=1&query="
            const googleMapQuery = `${lat},${long}`

            let anchorElem = document.createElement('a');
            anchorElem.text = googleMapQuery;

            anchorElem.onclick = () => {
                var redirectWindow = window.open(googleMapLink + googleMapQuery, '_blank');
                redirectWindow.location;
            };

            tdGPS.appendChild(anchorElem)

            trAccident.appendChild(tdDate)
            trAccident.appendChild(tdGPS)
            dataTable.appendChild(trAccident)
            accidents.append(dataTable)
        })
        loadMap(mapCenter, contourVille, json)
    })
    .catch((err) => {
        console.log(err)
    })
}

const loadMap = (mapCenter, contourVille, data) => {
    let mapContainer = L.DomUtil.get('mapid')
    if (mapContainer) {
        mapContainer._leaflet_id = null
    }
    let lat, long
      
    let mymap = L.map('mapid').setView([mapCenter.coordinates[1], mapCenter.coordinates[0]], 12)

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: OSM_apiKey
    }).addTo(mymap)

    data.forEach(element => { 
        let jour, mois, heure, minute
        const an = element.an
        let hrmn = `${element.hrmn}`
        let lat, long
        
        if (element.jour < 10) {
            jour = `0${element.jour}`
        } else {
            jour = element.jour
        }
        if (element.mois < 10) {
            mois = `0${element.mois}`
        } else {
            mois = element.mois
        }
        if (element.hrmn < 1000) {
            hrmn = `0${hrmn}`
        } 
        heure = hrmn.slice(0, 2)
        minute = hrmn.slice(2, 4)           
        if (element.lat) {
            lat = `${element.lat}`
            lat = `${lat.slice(0, 2)}.${lat.slice(2, lat.length)}`
        } else {
            lat = '-'
        }
        
        if (element.long) {
            long = `${element.long}`
            long = `${long.slice(0, 2)}.${long.slice(2, long.length)}`
        } else {
            long = '-'
        }

        if (long !== '-' && lat !== '-') {
            let marker = L.marker([lat, long]).addTo(mymap)
            marker.bindPopup(`<b>${jour}-${mois}-20${an} / ${heure}h${minute}</b><br>...`).openPopup()           
        }
    })

    let polygon = L.polygon(contourVille.coordinates).addTo(mymap)
}

function component() {
    const element = document.createElement('div');
  
    // Lodash, currently included via a script, is required for this line to work
    element.innerHTML = _.join(['Salut', 'webpack', 'babel'], ' ');
  
    return element;
  }

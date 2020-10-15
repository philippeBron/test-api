import _, { lowerCase } from 'lodash'
import $ from 'jquery'
// import CryptoJS from 'crypto-js'

//const OSD_baseUrl = "https://lab-mi.trial.opendatasoft.com/api/records/1.0/search/?"
//const OSD_apiKey = process.env.OSD_API_KEY
const OSD_baseUrl = "https://api-bacc.herokuapp.com/caracteristiques"

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
        json.records.forEach(element => {
            if(!communes.find(el => el.codeCommune === element.fields.com)){
                communes.push({
                    "codeCommune": element.fields.com,
                    "nbAccidents": 1
                })
            } else {
                for (let i = 0; i < communes.length; i++) {
                    if (communes[i].codeCommune === element.fields.com) {
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
                    getListAccident(commune.codeCommune, nomVille)
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

const getListAccident = (codeCommune, ville) => {
    let accidents = $('#accidents')
    accidents.empty()
    let tableTitle = document.createElement('h2')
    tableTitle.innerHTML = `${ville}`
    accidents.append(tableTitle)

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
        json.records.forEach(element => {
            let jour, mois, heure, minute
            const an = element.fields.an
            let hrmn = `${element.fields.hrmn}`
            let lat, long
            
            if (element.fields.jour < 10) {
                jour = `0${element.fields.jour}`
            } else {
                jour = element.fields.jour
            }
            if (element.fields.mois < 10) {
                mois = `0${element.fields.mois}`
            } else {
                mois = element.fields.mois
            }
            if (element.fields.hrmn < 1000) {
                hrmn = `0${hrmn}`
            } 
            heure = hrmn.slice(0, 2)
            minute = hrmn.slice(2, 4)
            
            if (element.fields.lat) {
                lat = `${element.fields.lat}`
                lat = `${lat.slice(0, 2)}.${lat.slice(2, lat.length)}`
            } else {
                lat = '-'
            }
            
            if (element.fields.long) {
                long = `${element.fields.long}`
                long = `${long.slice(0, 2)}.${long.slice(2, long.length)}`
            } else {
                long = '-'
            }

            let trAccident = document.createElement('tr')
            let tdDate = document.createElement('td')
            tdDate.innerHTML = `${jour}-${mois}-20${an} / ${heure}h${minute}`
            let tdGPS = document.createElement('td')
            tdGPS.innerHTML = `${lat}:${long}`
            trAccident.appendChild(tdDate)
            trAccident.appendChild(tdGPS)
            dataTable.appendChild(trAccident)
            accidents.append(dataTable)
        })
    })
    .catch((err) => {
        console.log(err)
    })
}

function component() {
    const element = document.createElement('div');
  
    // Lodash, currently included via a script, is required for this line to work
    element.innerHTML = _.join(['Salut', 'webpack', 'babel'], ' ');
  
    return element;
  }

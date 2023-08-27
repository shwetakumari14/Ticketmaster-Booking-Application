const express = require('express');
const cors = require('cors');
const geohash = require('ngeohash');
const request = require('request');
var path = require('path');
const app = express();
app.use(cors());

const root = path.join(__dirname, 'dist')
app.use(express.static(root));


const API_KEY = "wOQ4txXLssi18FLufIIPKF9Uk3gN2jdl"
const CLIENT_ID = "61da71830dc94cc3be82374fb734bca2"
const CLIENT_SECRET = "4580fcd361a445dbbd53a9891efd194f"

app.get('/events_listing/', async (req, res) =>{

    var keyword = req.query.keyword
    var radius = parseInt(req.query.radius)
    var lat = parseFloat(req.query.latitude)
    var long = parseFloat(req.query.longitude)
    var hash = geohash.encode(lat, long, 7)
    var category = req.query.category

    segmentMap = {
      Default: "",
      Music: "KZFzniwnSyZfZ7v7nJ",
      Sports: "KZFzniwnSyZfZ7v7nE",
      Arts: "KZFzniwnSyZfZ7v7na",
      Film: "KZFzniwnSyZfZ7v7nn",
      Miscellaneous: "KZFzniwnSyZfZ7v7n1",
    }
    var segmentId = segmentMap[category]

    var endpoint = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" + API_KEY + "&keyword=" + keyword + "&segmentId=" + segmentId + "&radius=" + radius + "&unit=miles&geoPoint=" + hash

    var dates = []
    var icons = []
    var events = []
    var genres = []
    var venues = []
    var ids = []
    var finalData = []

    request(endpoint, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var apiResponse = JSON.parse(body)
            if(apiResponse._embedded == null || apiResponse._embedded.events == null){
              res.json({finalData});
              return
            }
            if(apiResponse._embedded.events.length > 0){
              for (let i = 0; i < apiResponse._embedded.events.length; i++) {
                let data = apiResponse._embedded.events[i]
                if (data.dates != null){
                  if (data.dates.start != null){
                    if(data.dates.start.localDate != null && data.dates.start.localTime != null){
                        dates.push([data.dates.start.localDate, data.dates.start.localTime])
                    }
                    else if (data.dates.start.localDate != null && data.dates.start.localTime == null){
                        dates.push([data.dates.start.localDate, ""])
                    }
                    else if (data.dates.start.localDate == null && data.dates.start.localTime != null){
                        dates.push(["", data.dates.start.localTime])
                    }
                  }
                }
  
                if (data.images != null){
                  if (data.images.length > 0){
                      icons.push(data.images[0].url)
                  }
                }
  
                if (data.name != null){
                    events.push(data.name)
                }
  
                if (data.classifications != null){
                  if (data.classifications.length > 0 && data.classifications[0].segment != null){
                    if (data.classifications[0].segment.name != null){
                        genres.push(data.classifications[0].segment.name)
                    }
                  }
                }
  
                if (data._embedded != null){
                  if (data._embedded.venues != null){
                    if (data._embedded.venues.length > 0 && data._embedded.venues[0].name != null){
                      venues.push( data._embedded.venues[0].name)
                    }
                  }
                }
  
                if (data.id != null){
                    ids.push(data.id)
                }
          
              }
              for(let i=0; i<dates.length; i++){
                let result = {
                  'date' : dates[i],
                  'icons' : icons[i],
                  'events' : events[i],
                  'genres' : genres[i],
                  'venues' : venues[i],
                  'ids' : ids[i]
                }
                finalData.push(result)
              }
              res.json({finalData});
              return
            }else{
              res.json({finalData});
              return
          }
        } else {
          res.json({finalData});
          return
        }
    });

})

app.get('/events_details/:id', async (req, res) =>{
  var id = req.params.id

  var endpoint = "https://app.ticketmaster.com/discovery/v2/events/" + id + "?apikey=" + API_KEY
  var dates = []
  var artist = ""
  var venue = ""
  var genre = ""
  var priceRange = ""
  var ticketStyle = ""
  var ticketText = ""
  var ticketLocation = ""
  var stadiumImg = ""
  var eventName = ""
  var id = ""
  var x = ""
  var finalData = []

  request(endpoint, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var apiResponse = JSON.parse(body)
      if (apiResponse.dates != null){
        if (apiResponse.dates.start != null){
          if (apiResponse.dates.start.localDate != null && apiResponse.dates.start.localTime != null){
            dates.push(apiResponse.dates.start.localDate)
            dates.push(apiResponse.dates.start.localTime)
          }
          else if (apiResponse.dates.start.localDate != null && apiResponse.dates.start.localTime == null){
            dates.push(apiResponse.dates.start.localDate)
            dates.push("")
          }
          else if (apiResponse.dates.start.localDate == null && apiResponse.dates.start.localTime != null){
            dates.push("")
            dates.push(apiResponse.dates.start.localTime)
          }
        }
        if (apiResponse.dates.status != null){
          if (apiResponse.dates.status.code != null){
            let ticketStatus = apiResponse.dates.status.code
            if (ticketStatus == "onsale") {
              ticketStyle = "background-color: green;"
              ticketText = "On Sale"
            } else if (ticketStatus == "offsale") {
              ticketStyle = "background-color: red;"
              ticketText = "Off Sale"
            } else if (ticketStatus == "cancelled") {
              ticketStyle = "background-color: black;"
              ticketText = "Cancelled"
            } else if (ticketStatus == "postponed") {
              ticketStyle = "background-color: orange;"
              ticketText = "Postponed"
            } else if (ticketStatus == "rescheduled") {
              ticketStyle = "background-color: orange;"
              ticketText = "Rescheduled"
            }
          }
        }
      }

      if (apiResponse._embedded != null){
        if (apiResponse._embedded.attractions != null){
            for (let i = 0; i < apiResponse._embedded.attractions.length; i++) {
              let data = apiResponse._embedded.attractions[i]
              if (data.name != null){
                  artist += data.name + " | "
              }
            }
            artist = artist.substring(0, artist.length - 2);
        }

      }

      if (apiResponse._embedded != null){
        if (apiResponse._embedded.venues != null){
          if (apiResponse._embedded.venues.length > 0 && apiResponse._embedded.venues[0].name != null){
            venue = apiResponse._embedded.venues[0].name
          }
        }
      }

      if (apiResponse.classifications != null){
        if (apiResponse.classifications.length > 0){
          if (apiResponse.classifications[0].subGenre != null && (apiResponse.classifications[0].subGenre.name != "Undefined" && apiResponse.classifications[0].subGenre.name != "undefined")){
              genre += apiResponse.classifications[0].subGenre.name + " | "
          }
          if (apiResponse.classifications[0].genre != null && (apiResponse.classifications[0].genre.name != "Undefined" && apiResponse.classifications[0].genre.name!= "undefined")){
              genre += apiResponse.classifications[0].genre.name + " | "
          }
          if (apiResponse.classifications[0].segment != null && (apiResponse.classifications[0].segment.name != "Undefined" && apiResponse.classifications[0].segment.name != "undefined")){
              genre += apiResponse.classifications[0].segment.name + " | "
          }
          if (apiResponse.classifications[0].subType != null && (apiResponse.classifications[0].subType.name != "Undefined" && apiResponse.classifications[0].subType.name != "undefined")){
              genre += apiResponse.classifications[0].subType.name + " | "
          }
          if (apiResponse.classifications[0].type != null && (apiResponse.classifications[0].type.name != "Undefined" && apiResponse.classifications[0].type.name != "undefined")){
              genre += apiResponse.classifications[0].type.name + " | "
          }
        }
        genre = genre.substring(0, genre.length - 2);
      }

      if (apiResponse.priceRanges != null){
        if (apiResponse.priceRanges.length > 0){
          if(apiResponse.priceRanges[0].min != null && apiResponse.priceRanges[0].max != null){
            let temp = parseFloat(apiResponse.priceRanges[0].min) + " - " + parseFloat(apiResponse.priceRanges[0].max)
            priceRange = temp.toString()
          }
        }
      }

      if (apiResponse.url != null){
        ticketLocation = apiResponse.url
      }
    
      if (apiResponse.seatmap != null){
        if (apiResponse.seatmap.staticUrl != null){
          stadiumImg = apiResponse.seatmap.staticUrl
        }
      }
      
      if (apiResponse.name != null){
        eventName = apiResponse.name
      }

      if (apiResponse.id != null){
        id = apiResponse.id
      }
      let data = {
        "dates" : dates,
        "artist" : artist,
        "venue" : venue,
        "genre" : genre,
        "price_range" : priceRange,
        "ticket_style" : ticketStyle,
        "ticket_text" : ticketText,
        "ticket_location": ticketLocation,
        "stadium_img": stadiumImg,
        "event_name": eventName,
        "id": id
      }
      finalData.push(data)
      res.json({finalData});
      return
    }else {
      res.json({finalData});
      return
    }
  });

})

app.get('/venue_details/', async (req, res) =>{

  var venue = req.query.venue
  endpoint = "https://app.ticketmaster.com/discovery/v2/venues?apikey=" + API_KEY + "&keyword=" + venue

  var name = ""
  var address = "" 
  var phoneNumber = "" 
  var postalCode = ""
  var upcomingEvents = ""
  var venueImg = ""
  var openHoursDetail = ""
  var generalRule = ""
  var childRule = ""
  var lat = 0
  var long = 0
  var finalData = []

  request(endpoint, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var apiResponse = JSON.parse(body)
      if (apiResponse._embedded != null){
        if (apiResponse._embedded.venues != null){
          if (apiResponse._embedded.venues.length > 0){
            if (apiResponse._embedded.venues[0].name != null){
              name = apiResponse._embedded.venues[0].name
            }
            if (apiResponse._embedded.venues[0].address != null){
              address = apiResponse._embedded.venues[0].address.line1
            }
            if (apiResponse._embedded.venues[0].city != null){
              address += ", " + apiResponse._embedded.venues[0].city.name
            }
            if (apiResponse._embedded.venues[0].state != null){
              if (apiResponse._embedded.venues[0].state.stateCode != null){
                address += ", " + apiResponse._embedded.venues[0].state.stateCode
              }
            }
            if (apiResponse._embedded.venues[0].postalCode != null){
              postalCode = apiResponse._embedded.venues[0].postalCode
            }
            if (apiResponse._embedded.venues[0].url != null){
              upcomingEvents = apiResponse._embedded.venues[0].url
            }
            if (apiResponse._embedded.venues[0].images != null){
              venueImg = apiResponse._embedded.venues[0].images[0].url
            }
            if (apiResponse._embedded.venues[0].boxOfficeInfo != null) {
              if (apiResponse._embedded.venues[0].boxOfficeInfo.openHoursDetail != null){
                openHoursDetail = apiResponse._embedded.venues[0].boxOfficeInfo.openHoursDetail
              }
              if (apiResponse._embedded.venues[0].boxOfficeInfo.phoneNumberDetail != null){
                // let numbers = apiResponse._embedded.venues[0].boxOfficeInfo.phoneNumberDetail
                // let phone_numbers = [];
                // const regexp = new RegExp("\\+?\\(?\\d*\\)? ?\\(?\\d+\\)?\\d*([\\s./-]?\\d{2,})+","g");
                // phone_numbers = [...numbers.matchAll(regexp)];
                phoneNumber =apiResponse._embedded.venues[0].boxOfficeInfo.phoneNumberDetail
              }
            }
            if (apiResponse._embedded.venues[0].generalInfo != null ) {
              if (apiResponse._embedded.venues[0].generalInfo.generalRule != null){
                generalRule = apiResponse._embedded.venues[0].generalInfo.generalRule
              }
              if (apiResponse._embedded.venues[0].generalInfo.childRule != null){
                childRule = apiResponse._embedded.venues[0].generalInfo.childRule
              }
            }
            if (apiResponse._embedded.venues[0].location != null){
              if(apiResponse._embedded.venues[0].location.latitude != null){
                lat = parseFloat(apiResponse._embedded.venues[0].location.latitude)
              }
              if(apiResponse._embedded.venues[0].location.longitude != null){
                long = parseFloat(apiResponse._embedded.venues[0].location.longitude)
              }
            }
            let data = {
              "name" : name,
              "address": address,
              "phone_number" : phoneNumber,
              "postal_code": postalCode,
              "upcoming_events" : upcomingEvents,
              "venue_img" : venueImg,
              "open_hours_detail" : openHoursDetail,
              "general_rule" : generalRule,
              "child_rule" : childRule,
              "lat": lat,
              "long": long
            }
            finalData.push(data)
            res.json({finalData});
            return
          }else{
            res.json({finalData});
            return
          }
        }else{
          res.json({finalData});
          return
        }
      }else{
        res.json({finalData});
        return
      }
    }
    else {
      res.json({finalData});
      return
    }
  })


})

app.get('/autocomplete/', async (req, res) =>{

  var keyword = req.query.keyword
  endpoint = "https://app.ticketmaster.com/discovery/v2/suggest?apikey=" + API_KEY + "&keyword=" + keyword

  var names = []

  request(endpoint, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var apiResponse = JSON.parse(body)
      if(apiResponse._embedded != null){
        if(apiResponse._embedded.attractions != null) {
          if(apiResponse._embedded.attractions.length > 0){
            for (let i = 0; i < apiResponse._embedded.attractions.length; i++) {
              let data = apiResponse._embedded.attractions[i]
              if (data.name != null){
                names.push(data.name)
              }
            }
            res.json({"keywords" : names});
            return
          }else{
            res.json({"keywords" : names});
            return
          }
        }else{
          res.json({"keywords" : names});
          return
        }
      }else{
        res.json({"keywords" : names});
        return
      }
    } else {
      res.json({"keywords" : names});
      return
    }
  })
})

app.get('/artists_details/', async (req, res) =>{
  var artists = req.query.keyword.split("|");
  var SpotifyWebApi = require('spotify-web-api-node');
  var spotifyApi = new SpotifyWebApi({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  });

  await spotifyApi.clientCredentialsGrant().then(
    function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    }
  );

  var artistName = ""
  var popularity = 0
  var followers = 0
  var spotifyLink = "" 
  var artistImg = ""
  var id = ""
  var artistAlbums = []
  var finalData = []

  for(let i=0; i<artists.length; i++){
    let artist = artists[i]
    await spotifyApi.searchArtists(artist)
    .then(function(data1) {
        if (data1.body.artists != null){
          if (data1.body.artists.items != null) {
            artistsData = data1.body.artists.items
            for (let i = 0; i < artistsData.length; i++) {
              let data =  artistsData[i]
              if (data.name != null) {
                let artistL= artist.toLowerCase();
                let dataL = data.name.toLowerCase();
                let artistLower = artistL.trim()
                let dataLower = dataL.trim()
                if (artistLower == dataLower){
                  
                  artistName = data.name
                  if (data.popularity != null) {
                    popularity = data.popularity
                  }
                  if (data.followers != null) {
                    if(data.followers.total != null){
                      let follower = data.followers.total
                      followers = follower.toLocaleString("en-US");
                    }
                  }
                  if (data.images != null) {
                    artistImg = data.images[0].url
                  }
                  if (data.external_urls != null) {
                    spotifyLink = data.external_urls.spotify
                  }
                  if (data.id != null) {
                    id = data.id
                  }
                }
              }
              break
            }
          }
        }
        
    }, function(err) {
      res.json({finalData});
      return
    });
    if(id != "" && id != " " && id != "  "){
      await spotifyApi.getArtistAlbums(id)
      .then(function(data2) {
        artistAlbums = []
        if(data2.body.items != null){
          for (let i = 0; i < 3; i++) {
            dataImg = data2.body.items[i]
            if (dataImg.images){
              artistAlbums.push(dataImg.images[0].url)
            }
          }
        }
      }, function(err) {
        res.json({finalData});
        return
      });

      let result = {
        "artist_name" : artistName,
        "popularity": popularity,
        "followers" : followers,
        "spotify_link": spotifyLink,
        "artist_img" : artistImg,
        "artist_albums" : artistAlbums,
      }
      finalData.push(result)  
    }
  }
  
  if(finalData.length > 0){
    res.json({finalData});
    return
  }
})

app.get("*", (req, res) => {
  res.sendFile("index.html", {root});
});

const port = parseInt(process.env.port) || 8080

app.listen(port, ()=> console.log("Listening to port ", port))
// ##########################################
// # Project 6: Neighorhood Map (Udacity Full Stack Web Developer Nanodegree)
// # Date Started: 02/01/2017
// # Date Completed: 02/25/2017
// # Submitted by: Fang Wang
// ##########################################
//
// ######################################## Media File #############
// # Description: This is the JS file for Neighborhood map
// #################################################################

//Model
var initialLocations = [
	{
		name: 'Steven Creek Trail',
		lat: 37.400,
		long: -122.070
	},
	{

		name: 'Rancho San Antonio Trail',
		lat: 37.333,
		long: -122.087
	},
	{

		name: 'Hidden Villa',
		lat: 37.353,
		long: -122.159
	},
	{
		name: 'Mission Peak Regional Preserve',
		lat: 37.512641,
		long: -121.880588
	},
	{
		name: 'San Tomas Aquino Creek Trail',
		lat: 37.384277,
		long: -121.968765
	},
	{
		name: 'Los Gatos Creek Trail',
		lat: 37.307468,
		long: -121.913916
	},
	{
		name: "Maywood Park Creek Trail",
		lat: 37.335244,
		long: -121.986994
	},
	{
		name: 'Palo Alto Baylands Nature',
		lat: 37.450409,
		long: -122.098457
	},
	{
		name: "Alviso Marina County Park",
		lat: 37.445289,
		long: -121.982481
	}
];

/// Declaring global variables now to satisfy strict mode
var map;

//global google map infowindow, avoid multiple infoWindow problem.
var infoWindow;
//var $wikiElem = $('#wikipedia-links');

//Foursquare API clientID and ClientSecret variables
var clientID;
var clientSecret;
// add alerted parameter to avoid popping up multiple windows for all locations.
localStorage.setItem('alerted', 'no');
//Construct a Location with a series of variables
var Location = function(data) {
	var self = this;
	this.name = data.name;
	this.lat = data.lat;
	this.long = data.long;
	//infowindow information
	this.URL = '';
	this.street = '';
	this.city = '';

	this.visible = ko.observable(true);


	//foursquare api: load foursquare data (retrieve address, website and so on)
	var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.long + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;

	// parse the JSON data file
	$.getJSON(foursquareURL).done(function(data) {
		var results = data.response.venues[0];
		self.URL = results.url;
		if (typeof self.URL === 'undefined'){
			self.URL = '';
		}
		self.street = results.location.formattedAddress[0];
    self.city = results.location.formattedAddress[1];

	}).fail(function() {
		//refactor code to have one alert pops up only, not for every location.
		var alerted=localStorage.getItem('alerted');
		if (alerted != 'yes') {
		alert("There was an error with the Foursquare API call. Please refresh the page and try again to load Foursquare data.");
	};
		localStorage.setItem('alerted','yes');	});

	this.contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>"
	//create infoWindow with content
	infoWindow = new google.maps.InfoWindow({content: self.contentString});

	//resize the marker icon
	var icon = {
		url: 'http://maps.google.com/mapfiles/kml/shapes/hiker.png',
		scaledSize: new google.maps.Size(30,30)
	};

	// create marker
	this.marker = new google.maps.Marker({
			position: new google.maps.LatLng(data.lat, data.long),
			map: map,
			title: data.name,
			icon: icon
	});

	// show marker
	this.showMarker = ko.computed(function() {
		if(this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	}, this);

	//click marker, update infoWindow content, call wiki api
	this.marker.addListener('click', function(){
		self.contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>"
        infoWindow.setContent(self.contentString);
				////////////after click start to load wikiData
				// load wikipedia data
				myViewModel.wikiElem([]);
				//$wikiElem.text("");
				//time out case
				var wikiRequestTimeout = setTimeout(function(){
        //$wikiElem.text("failed to get wikipedia resources");
				myViewModel.wikiElem.push("failed to get wikipedia resources");
      	}, 8000);

				$.ajax({
					url: 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.city.split(',')[0] + '&format=json&callback=wikiCallback',
					dataType: 'jsonp',
					success: function(response) {
						// figure out why ko array isnt updating
						// articleList is just an array is strings
						var articleList = response[1];
						if (articleList.length < 1) {
							//if no article, doing nothing
						} else {
							//if not empty, load data to wikiElem
							for (var i = 0; i < articleList.length; i++) {
								articleStr = articleList[i];
								// $wikiElem.append('<li><a href="http://en.wikipedia.org/wiki/' + '">' + articleStr + '</a></li>');
								myViewModel.wikiElem.push('<li><a href="http://en.wikipedia.org/wiki/' + '">' + articleStr + '</a></li>');
							};
							clearTimeout(wikiRequestTimeout);
						}}
					});
		//open infoWindow, there is no need to have infoWindow close  function since I use a global infoWindow.
		infoWindow.open(map, this);

		//annimation bounce after click
		self.marker.setAnimation(google.maps.Animation.BOUNCE);
      	setTimeout(function() {
      		self.marker.setAnimation(null);
     	}, 2100);

	});
	//bounce
	this.bounce = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};
};



function AppViewModel() {
	var self = this;
	//pass searchTerm
	this.searchTerm = ko.observable("");

	//store location information
	this.locationList = ko.observableArray([]);

	//store wiki data
	this.wikiElem = ko.observableArray([]);

	//init map
	map = new google.maps.Map(document.getElementById('map'), {
			zoom: 10,
			center: {lat: 37.384277, lng: -121.9687}
	});

	// Foursquare API settings
	clientID = "DMVHTRSJHHJE4V3HQNAFPOTCVF133W1FQ2HHWVVXRDZDIJ1N";
	clientSecret = "ILSGVBGJUOCBZI2SZZTWUE5CK4G2E3G5FRKVYMZGUA3I4Y2W";

	//update location list by calling Location constructor
	initialLocations.forEach(function(locationItem){
		self.locationList.push( new Location(locationItem));
	});


	//update filteredList
	this.filteredList = ko.computed( function() {
		var filter = self.searchTerm().toLowerCase();
		if (!filter) {
			self.locationList().forEach(function(locationItem){
				locationItem.visible(true);
			});
			return self.locationList();
		} else {
			return ko.utils.arrayFilter(self.locationList(), function(locationItem) {
				var string = locationItem.name.toLowerCase(); //case insensitive
				var result = (string.search(filter) >= 0);  //if existing any match, result=True
				locationItem.visible(result);
				return result;
			});
		}
	}, self);
}
var myViewModel;
function startApp() {
	myViewModel=new AppViewModel();
	ko.applyBindings(myViewModel);
}

function errorHandling() {
	alert("Loading Google Maps Failed!! Please check your internet connection and try again.");
}

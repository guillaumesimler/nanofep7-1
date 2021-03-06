/* App.js
--------- programmed by Guillaume Simler
This is the main part of the program bringing the logic into the app. 

*/ 



/* !!!!!!!!!!!!!!!!!! init Map !!!!!!!!!!!!!!!!!!  

	This actually starts the program as it launches (in the respective order) 
		1. the google Map api
		2. the binding
 */

var initMap = function() {

	//Get the data for the map
	var mapAttr = MapCriteria;

	//Load the map
	map = new google.maps.Map(document.getElementById('map-section'), {
		center: mapAttr.center,
		zoom: mapAttr.zoom,
	});	


	// Apply knowck out binding
	ko.applyBindings(new viewModel());

};


var viewModel = function() {

	var self = this;

	self.places = ko.observableArray([]);


	// For Loop to implement the objects to follow and creating a marker for each
	locations.forEach( function(location) {
		var i = 0;

		var place = new Place(location);

		//create the infowindow with Wikipedia informations (for more details,
		//pleace look at the function itselfs)
		place.infowindow = new google.maps.InfoWindow();

		loadWiki(place, place.infowindow);
		
		//Create the marker(s)

		var marker = new google.maps.Marker({
			position: place.position,
			map: map,
			title: place.name,
			animation: google.maps.Animation.DROP,
			zIndex: i++,
			icon: place.image
		});

		//Add an event listener to react on click
		marker.addListener('click', function() {
			place.infowindow.open(map, marker);

			if (marker.getAnimation() !== null) {
				marker.setAnimation(null);
			} else {
				marker.setAnimation(google.maps.Animation.BOUNCE);
				setTimeout(function() { 
					marker.setAnimation(null); 
				}, 1000);
			}	
		});

		// Add the marker to the object

		place.marker = ko.observable(marker);

		self.places.push(place);

	});

	/* !!!!!!!! Build in search function  !!!!!*/
	self.query = ko.observable('');

	self.searchedPlaces = ko.computed(function() {

		return ko.utils.arrayFilter(self.places(), function(item) {
			var checkVal = (item.name.toLowerCase().indexOf(self.query()
				.toLowerCase()) >= 0) ||(item.type.toLowerCase()
				.indexOf(self.query().toLowerCase()) >= 0) ;

			if (checkVal) {
				item.marker().setVisible(true);
			} else { 
				item.marker().setVisible(false);
			}

			return checkVal;

		});
	});


};

/* !!!!!!!!!!!!!!!!!! helper functions !!!!!!!!!!!!!!!!!!  */

	/* !!!!!!!!!!!!!!!!!! place !!!!!!!!!!!!!!!!!! 
		The aim of the function is to create the object out of the model section 
		for the viewmodel.

		Naturally the function cannot work independently from ViewModel.  
		
	*/

var Place = function(data) {
	var self = this;

	self.name = data.name;
	self.position = data.position;
	
	self.type = data.type;

	// Gets the icon depending on its type
	self.image = function(data) {
		return Icons[data.type].url;
	}(self);

	self.marker = ko.observable('');

};

	/* !!!!!!!!!!!!!!!!!! loadWiki !!!!!!!!!!!!!!!!!! 
		The aim of the function is to get the data from Wikipedia. 

		This function has two fallback options: 
			(1) in case there is no wikipedia article
			(2) in case there is no link to wikipedia or another errors

		The function passes two parameter:
			- input, which is the object created previously with all location 
			information
			- infowindow, the infowindow created just above, in order to ensure
			 getting the scope from Viewmodel in loadWiki

		Naturally the function cannot work independently from ViewModel.  
		
	*/
var loadWiki = function(input, infowindow) {

	var Input = input.name;
	var content;

	// Load Wikipedia Article
	var WikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + 
		Input + '&prop=revisions&rvprop=content&format=json&callback=wikiCallback';
	
	// Last Fallback option as requested by rubric. Though this solution was 
	// not needed. The "catastrophic" error could not happen as the user has
	// no mean to change the Url. My previous version was sufficient !
	
	var abortRequest = setTimeout( function(){
		content = ('<p> failed to get this specific wikipedia article about ' + 
			Input + '</p><p>A major problem occured with Wikipedia - '+
			'please try later or contact your administrator</a></p>');

		
		infowindow.setContent(content);
	},2500);


	$.ajax({
		url:WikiUrl,
		dataType: "jsonp"
	})
	.done(function(response) {
			var articleList = response[1][0];
			var articleSum = response[2][0];
			var articleUrl = response[3][0];



			if (articleList){
				content = '<h5> <a href="' + articleUrl + '" target="_blank">' +
				articleList + '</a></h5>' +'<p>' + articleSum + '</p>';

			/* Fallback n°1: in case there is no article the response will not 
			have a second element in the array or if it will be null or 
			undefinied. In any case, it will be falsy*/

			} else {

				content = ('<p> failed to get this specific wikipedia article'+
				'about ' + Input + '</p><p>Please try with the <a href= '+
				'"https://en.wikipedia.org/wiki/Munro" target="_blank">generic'+
				' article about Munros</a></p>');
			}          

			infowindow.setContent(content);

			clearTimeout(abortRequest);
		})

		/* Fallback n°2: in this case the AJAX request completely failed and 
		this creates this error message */

	.fail( function(response){
			content = ('<p> failed to get this specific wikipedia article about ' + 
				Input + '</p><p>A major problem occured with Wikipedia - '+
				'please try later or contact your administrator</a></p>');

			
			infowindow.setContent(content);

			clearTimeout(abortRequest);
		}
	);
};
		

/* !!!!!!!!!!!!!!!!!! additional functions !!!!!!!!!!!!!!!!!!  */

// Function enabling a response of when clicking an element of the list

var reactiveList = function(response){

	response.marker().setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function() { 
		response.marker().setAnimation(null); 
	}, 1000);

	response.infowindow.open(map, response.marker())
	
 };


// Fallback function for Google Maps
var failMap = function() {
	var errorMsg = '<div> <picture>' + '<source media="(min-width: 800px)" ' + 
		'srcset="images/error-800_2x.jpg 2x, images/error-800_1x.jpg 1x">' + 
		'<source media="(max-width: 799px)" srcset="images/error-400_2x.jpg 2x,'+
		' images/error-400_1x.jpg 1x"> '+' <img src="images/error-800_1x.jpg" '+
		' alt="a picture from Ben Lui" class="img-responsive"> '+
		' <p>This is indeed a Munro, but you should see a Map instead. There'+
		' was an error with Google Maps</p></picture></div>'; 
	$("#map-section").append(errorMsg);
};


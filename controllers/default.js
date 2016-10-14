exports.install = function() {
	F.route('/', view_index);
	F.route('/providers/', view_providers);
	F.route('/providers/county/{pCounty}/service/{pService}/category/{pCategory}/', view_providers);
	F.route('/code/', view_code);
};

function view_index() {
	var self 		= this;
	var sql 		= DATABASE();
	var Acounties 	= [];
	var Aservices 	= [];	

	sql.query('counties', 'SELECT nextval(\'unique_id\'::regclass) AS "ID", "COUNTY" FROM (SELECT DISTINCT "COUNTY" FROM "PROVIDERS") UNIQUE_COUNTIES ORDER BY "COUNTY" ASC');	
	sql.query('services', 'SELECT nextval(\'unique_id\'::regclass) AS "ID", "SOCIAL_SERVICE" FROM (SELECT DISTINCT "SOCIAL_SERVICE" FROM "PROVIDERS") UNIQUE_SERVICES');

	sql.exec(function(err, response) {		
		
		if (err){
			return self.invalid().push(err);
		}	

		Object.keys(response.counties).forEach(function(key,index) {
		    Acounties.push(response.counties[key].COUNTY);
		});
		Object.keys(response.services).forEach(function(key,index) {
		    Aservices.push(response.services[key].SOCIAL_SERVICE);
		});

		response.counties 	= Acounties;
		response.services 	= Aservices;

		self.view('index', response);
	});
}

function view_providers(pCounty, pService, pCategory) {
	var self 		= this;
	var county, service;
	
	county 			= ( (pCounty !== undefined) && (pCounty != '-') ) ? decodeURI(pCounty) : '';
	service 		= ( (pService !== undefined) && (pService != '-') ) ? decodeURI(pService) : '';
	category 		= ( (pCategory !== undefined) && (pCategory != '-') ) ? decodeURI(pCategory) : '';

	var sql  		= DATABASE();
	var Locations	= {
		"type"	: "FeatureCollection", 
		"crs"	: {
			"type": "name",
			"properties": {
				"name"	: "urn:ogc:def:crs:OGC:1.3:CRS84" 
			}
		}
	};

	//Default select
	var select = sql.select('providers', '"PROVIDERS"');

	//Check for variable in get params
	//- - - - - - - - 
	if (county != '') {
		select.where('"COUNTY"', county);
	}

	if (service != '') {
		select.where('"SOCIAL_SERVICE"', service);
	}

	if (category != '') {
		select.like('"CATEGORY"', category, '*');
	}
	//- - - - - - - - 
	// End of dynamic where

	sql.exec(function(err, response) {				
		if (err){
			return self.invalid().push(err);
		}	

		Locations.features = [];
		Object.keys(response.providers).forEach(function(key,index) {
		    var feature = { "type": "Feature" };
		    var MyAddress = "";

		    if (!(typeof response.providers[key].LATITUDE === 'undefined' || !response.providers[key].LATITUDE))  {
			    if (!(typeof response.providers[key].STREET === 'undefined' || !response.providers[key].STREET))  {
			     	MyAddress += response.providers[key].STREET;

			     	if (!(typeof response.providers[key].NO === 'undefined' || !response.providers[key].NO))  {
			     		MyAddress += ", Nr. " + response.providers[key].NO;
			     	}
			    }
			    //console.log("Address: " + MyAddress);

			    if (MyAddress != ""){
				    feature.properties = {
				    	"name"		: response.providers[key].NAME,
				    	"address" 	: MyAddress,
				    	"city"		: response.providers[key].CITY,
						"county"	: response.providers[key].COUNTY,
						"phone"		: (typeof response.providers[key].PHONE === 'undefined' || !response.providers[key].PHONE) ? "-" : response.providers[key].PHONE,
						"email"		: (typeof response.providers[key].EMAIL === 'undefined' || !response.providers[key].EMAIL) ? "-" : response.providers[key].EMAIL,
						"lat"		: response.providers[key].LATITUDE, 
						"lng"		: response.providers[key].LONGITUDE 
				    }
				    feature.geometry = { 
						"type": "Point", 
						"coordinates": [ response.providers[key].LONGITUDE, response.providers[key].LATITUDE ] 
					} 
					Locations.features.push(feature);
				}
			}
		});

		self.json(Locations);
	});
}

function view_code() {
	var self 			= this;	
	var sql 			= DATABASE();		

	//Node-Geocoder
	var NodeGeocoder 	= require('node-geocoder');
	var options = {
	  //provider: 'openmapquest',
	  //provider: 'opencage',
	  provider: 'google',
	  thumbMaps: false,
	  maxResults: 1,
	  httpAdapter: 'https',
	  //apiKey: 'gmWfsYhW6sGeMj5RGraVsvBdYoWXbEzu',
	  //apiKey: '00813ac0165dc58e255301ead989c39a',
	  apiKey: 'AIzaSyBrNSZa1sTTwN5p-8l6QJQtXuc833Szmh4',
	  formatter: null
	};
	var geocoder = NodeGeocoder(options);
	//~Node-Geocoder

	//Select all providers
	sql.query('providers', 'SELECT "ID", "NO", "STREET", "CITY", "COUNTY" FROM "PROVIDERS" WHERE "LATITUDE" IS NULL AND "LONGITUDE" IS NULL ORDER BY "ID" ASC');	

	sql.exec(function(err, response) {			
		if (err){
			return self.invalid().push(err);
		}

		//For each database record
		Object.keys(response.providers).forEach(function(key,index) {							
			response.providers[key].SUCCESS = true;
			

			var NO 		= (typeof response.providers[key].NO !== 'undefined' && response.providers[key].NO !== null) ? response.providers[key].NO + " " : "";
			var STREET 	= (typeof response.providers[key].STREET !== 'undefined' && response.providers[key].STREET !== null) ? response.providers[key].STREET + "," : "";
			var COUNTY 	= (typeof response.providers[key].COUNTY !== 'undefined' && response.providers[key].COUNTY !== null) ? response.providers[key].COUNTY + "," : ""
			var CITY 	= response.providers[key].CITY + ",";
			var COUNTRY = "România";

			// console.log(NO);
			// console.log(response.providers[key].STREET);
			// console.log("Address: " + NO + STREET.trim() + CITY.trim() + COUNTRY);
			// console.log("--------------------");

			//Geocode its address
			geocoder.geocode( NO + STREET.trim() + CITY.trim() + COUNTRY, function(error, res) {
				console.log(res);

				if ((res !== "undefined") && (res.length > 0)) {

					//If address is found
				  	if (res[0].extra.confidence >= 0.5) {

				  		//Update database record
						sql.update('provider', '"PROVIDERS"').make(function(builder) {
							builder.set({ LATITUDE: res[0].latitude, LONGITUDE: res[0].longitude });
							builder.where('ID', response.providers[key].ID);
						});
				  	} else {
				  		//Update database record
						sql.update('provider', '"PROVIDERS"').make(function(builder) {
							builder.set({ LATITUDE: null, LONGITUDE: null });
							builder.where('ID', response.providers[key].ID);
						});
				  	} 

				  	sql.exec(function(e, r) {
						if (err){
							return self.invalid().push(e);
						}
					});
			  	}
			});
		});

		//Select all providers
		sql.query('providers', 'SELECT "ID", "NO", "STREET", "CITY", "COUNTY", "LONGITUDE", "LATITUDE", CASE WHEN "LONGITUDE" IS NOT NULL THEN \'true\' ELSE \'false\' END AS "SUCCESS" FROM "PROVIDERS" ORDER BY "ID" ASC');	
		sql.exec(function(err, response) {			
			if (err){
				return self.invalid().push(err);
			}

			self.layout('layout_wo_map');
			self.view('geocode-response', response);
		});
      // <font color="green">&#x2714;</font>
      // 
	});
}

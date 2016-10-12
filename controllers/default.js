exports.install = function() {
	F.route('/', view_index);
	F.route('/providers/', view_providers);
	F.route('/providers/county/{pCounty}/service/{pService}/', view_providers);
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

function view_providers(pCounty, pService) {
	var self 		= this;
	var county, service;
	
	county 			= ( (pCounty !== undefined) && (pCounty != '-') ) ? decodeURI(pCounty) : '';
	service 		= ( (pService !== undefined) && (pService != '-') ) ? decodeURI(pService) : '';

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
		console.log(Locations.features.length);

		self.json(Locations);
	});
}

function view_code() {
	var self 			= this;	
	var sql 			= DATABASE();		
	var country			= "România";	

	//Node-Geocoder
	var NodeGeocoder 	= require('node-geocoder');
	var options = {
	  //provider: 'openmapquest',
	  provider: 'opencage',
	  thumbMaps: false,
	  maxResults: 1,
	  httpAdapter: 'http',
	  //apiKey: 'gmWfsYhW6sGeMj5RGraVsvBdYoWXbEzu',
	  apiKey: '00813ac0165dc58e255301ead989c39a',
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
			//var MyAddress = response.providers[key].NO + " " + response.providers[key].STREET + ',' + response.providers[key].CITY;

			//Geocode its address
			geocoder.geocode(response.providers[key].NO + " " + response.providers[key].STREET + ',' + response.providers[key].CITY + ',' + response.providers[key].COUNTY + ',' + country, function(error, res) {
			//geocoder.geocode({address: MyAddress, countryCode: 'ro', minConfidence: 0.5, limit: 1}, function(err, res) {
				//console.log(res);

				if ((res !== "undefined") && (res.length > 0)) {

					//If address is found
				  	if (res[0].extra.confidence <= 10) {

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
					    //console.log(r.provider); // returns {Number} (count of changed rows)
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

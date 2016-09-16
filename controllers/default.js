exports.install = function() {
	F.route('/', view_index);
	F.route('/providers/', view_providers);
	F.route('/providers/county/{pCounty}/service/{pService}/', view_providers);
};

function view_index() {
	var self 		= this;
	var sql 		= DATABASE();
	var Acounties 	= [];
	var Aservices 	= [];	

	sql.query('counties', 'SELECT nextval(\'unique_id\'::regclass) AS "ID", "COUNTY" FROM (SELECT DISTINCT "COUNTY" FROM "PROVIDERS") UNIQUE_COUNTIES');	
	sql.query('services', 'SELECT nextval(\'unique_id\'::regclass) AS "ID", "SOCIAL_SERVICE" FROM (SELECT DISTINCT "SOCIAL_SERVICE" FROM "PROVIDERS") UNIQUE_COUNTIES');

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

	console.log("County:" + county);	
	console.log("Service:" + service);

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
		    feature.properties = {
		    	"name"		: response.providers[key].NAME,
		    	"address" 	: response.providers[key].ADDRESS,
		    	"city"		: response.providers[key].CITY,
				"county"	: response.providers[key].COUNTY,
				"lat"		: response.providers[key].LATITUDE, 
				"lng"		: response.providers[key].LONGITUDE 
		    }
		    feature.geometry = { 
				"type": "Point", 
				"coordinates": [ response.providers[key].LONGITUDE, response.providers[key].LATITUDE ] 
			} 
			Locations.features.push(feature);
		});

		self.json(Locations);
	});
}

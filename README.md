# Social Services Provider Map 

## Description

Web application to display and manage social services providers. 

## Technologies
- Node.JS + Total.JS Framework (server side)
- Leaflet.JS (javascript map)
- Bootstrap (css)
- PostgreSQL Database
 
## Features
 - GeoJSON map provided by Openstreetmap

## To do
- Backend for administration and auto geocoding 

## Install dependencies

- $ npm install

## Database schema

```
-- Table: "PROVIDERS"

-- DROP TABLE "PROVIDERS";

CREATE TABLE "PROVIDERS"
(
  "ID" bigint NOT NULL DEFAULT nextval('providers_id_seq'::regclass),
  "NAME" character(255),
  "ADDRESS" character varying(255),
  "CITY" character varying(255),
  "COUNTY" character varying(255),
  "SOCIAL_SERVICE" character varying(255),
  "CATEGORY" character varying(255),
  "EMAIL" character varying(100),
  "PHONE" character varying(100),
  "LATITUDE" double precision,
  "LONGITUDE" double precision,
  CONSTRAINT "ID_PK" PRIMARY KEY ("ID")
)
WITH (
  OIDS=FALSE
);
```

## Contribute
Anyone is encouraged to contribute to the project by forking and submitting a pull request.

By contributing to this project, you grant a world-wide, royalty-free, perpetual, irrevocable, non-exclusive, transferable license to all users under the terms of the Gnu General Public License v2 or later.

/*
Copyright - 2024 2025 - wwwouaiebe - Contact: https://www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
/*
Changes:
	- v1.0.0:
		- created
Doc reviewed 20250124
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import theRelationsReport from '../Reports/RelationsReport.js';
import theDocConfig from '../interface/DocConfig.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * This class search all bus/tram/metro relations without route_master and add the errors to the report
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class RoutesWithoutRouteMasterValidator {

	/**
	 * Add the errors to the report
	 * @param {Array} elements An erray with routes without route_master
	 */

	#reportMissingRouteMaster ( elements ) {

		theRelationsReport.add ( 'h1', 'Routes without route_master' );

		if ( 0 === elements.length ) {
			theRelationsReport.add ( 'p', 'Nothing found' );
		}
		else {
			elements.forEach (
				element => {
					theRelationsReport.add (
						'p',
						'Error M001: route wihout route_master ' + theRelationsReport.getOsmLink ( element ),
						element
					);
				}
			);
		}
	}

	/**
	 * fetch data from the overpass-api or the dev data
	 * @param {String} uri The uri to use for fetching
	 */

	async #loadDevData ( uri ) {
		console.info ( 'Warning: osm dev data are used' );
		console.info ( uri );

		try {
			const { default : osmData } = await import (
				'../../../devData/routesMasterDevData-' + theDocConfig.network.toUpperCase ( ) + '.json',
				{ with : { type : 'json' } }
			);
			return osmData.elements;
		}
		catch {
			return null;
		}

	}

	/**
	 * fetch data from the overpass-api
	 * @param {String} uri The uri to use for fetching
	 */

	async #fetchOverpassApi ( uri ) {

		// fetch overpass-api
		let elements = null;
		await fetch ( uri )
			.then (
				response => {
					if ( response.ok ) {
						return response.json ( );
					}
					console.error ( String ( response.status ) + ' ' + response.statusText );
				}
			)
			.then (
				jsonResponse => {
					elements = jsonResponse.elements;
				}
			)
			.catch (
				err => {
					console.error ( err );
				}
			);

		return elements;
	}

	/**
	* fetch the data from overpass-api
	 */

	 async fetchData ( ) {

		let uri =
			'https://lz4.overpass-api.de/api/interpreter?data=[out:json][timeout:40];rel' +
			'["network"="' + theDocConfig.network + '"]' +
			'["type"="route"]' +
			'["route"="' + theDocConfig.vehicle + '"]' +
			'->.all;rel' +
			'["route_master"="' + theDocConfig.vehicle + '"]' +
			'(br.all);rel' +
			'["route"="' + theDocConfig.vehicle + '"]' +
			'(r)->.b;(.all; - .b; );out;';

		let elements = null;

		const useDevData = new URL ( window.location ).searchParams.get ( 'devData' );

		if ( useDevData ) {
			elements = await this.#loadDevData ( uri );
		}
		else {
			elements = await this.#fetchOverpassApi ( uri );
		}

		this.#reportMissingRouteMaster ( elements );
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		Object.freeze ( this );
	}
}

export default RoutesWithoutRouteMasterValidator;

/* --- End of file --------------------------------------------------------------------------------------------------------- */
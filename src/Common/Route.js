/*
Copyright - 2025 - wwwouaiebe - Contact: https://www.ouaie.be/

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
Doc reviewed 20250711
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import PolylineEncoder from '../Common/PolylineEncoder.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * A simple container for an osm or gtfs route
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class Route {

	/**
	 * The name of the route (empty for GTFS)
	 * @type {String}
	 */

	#name;

	/**
	 * The from tag of the route (empty for GTFS)
	 * @type {String}
	 */

	#from;

	/**
	 * The to tag of the route (empty for GTFS)
	 * @type {String}
	 */

	#to;

	/**
	 * The ref tag of the route
	 * @type {String}
	 */

	#ref;

	/**
	 * An array with the ref of the platforms used by the route
	 * @type {Array.<String>}
	 */

	#platforms = [];

	/**
	 * A unique identifier for the route (empty for OSM). Equal to the primary key of the route in the gtfs db
	 * @type {String}
	 */

	#shapePk;

	/**
	 * The gtfs start date of the route
	 * @type {String}
	 */

	#startDate;

	/**
	 * The gtfs end date of the route
	 * @type {String}
	 */

	#endDate;

	/**
	 * The coords of the route encoded with PolylineEncoder
	 * @type {String}
	 */

	#nodes;

	/**
	 * The osm ways of the route
	 * @type {OsmWay}
	 */

	#ways = [];

	/**
	 * The osmId of the route
	 * @type {?Number}
	 */

	#osmId;

	/**
	 * The operator of the route
	 * @type {String}
	 */

	#operator;

	/**
	 * The fixme of the route
	 * @type {String}
	 */

	#fixme;

	/**
	 * The name of the route (empty for GTFS)
	 * @type {String}
	 */

	get name ( ) { return this.#name; }

	/**
	 * The from tag of the route (empty for GTFS)
	 * @type {String}
	 */

	get from ( ) { return this.#from; }

	/**
	 * The to tag of the route (empty for GTFS)
	 * @type {String}
	 */

	get to ( ) { return this.#to; }

	/**
	 * The ref tag value of the route
	 * @type {String}
	 */

	get ref ( ) { return this.#ref; }

	/**
	 * An array with the ref of the platforms used by the route
	 * @type {Array.<String>}
	 */

	get platforms ( ) { return this.#platforms; }

	/**
	 * A unique identifier for the route (empty for OSM). Equal to the primary key of the route in the gtfs db
	 * @type {String}
	 */

	get shapePk ( ) { return this.#shapePk; }

	/**
	 * The gtfs start date of the route
	 * @type {String}
	 */

	get startDate ( ) { return this.#startDate; }

	/**
	 * The gtfs end date of the route
	 * @type {String}
	 */

	get endDate ( ) { return this.#endDate; }

	/**
	 * The coords of the route encoded with PolylineEncoder
	 * @type {String}
	 */

	get nodes ( ) { return this.#nodes; }

	/**
	 * The osm ways of the route
	 * @type {OsmWay}
	 */

	get ways ( ) { return this.#ways; }

	/**
	 * The osmId of the route
	 * @type {?Number}
	 */

	get osmId ( ) { return this.#osmId; }

	/**
	 * The osm type of the route
	 * @type {String}
	 */

	get osmType ( ) { return 'relation'; }

	/**
	 * The operator of the route
	 * @type {String}
	 */

	get operator ( ) { return this.#operator; }

	/**
	 * The fixme of the route master
	 * @type {String}
	 */

	get fixme ( ) { return this.#fixme; }

	/**
	 * An object that can be used by JSON.stringify with all the properties of the route.
	 * @type {Object}
	 */

	get jsonObject ( ) {
		const jsonRoute = {
			name : this.#name,
			from : this.#from,
			to : this.#to,
			ref : this.#ref,
			platforms : [],
			shapePk : this.#shapePk,
			startDate : this. #startDate,
			endDate : this.#endDate,
			nodes : this.#nodes,
			ways : this.#ways,
			osmId : this.#osmId,
			operator : this.#operator,
			fixme : this.#fixme
		};
		this.#platforms.forEach (
			platform => jsonRoute.platforms.push ( platform )
		);
		Object.freeze ( jsonRoute.platforms );
		return Object.freeze ( jsonRoute );
	}

	/**
	 * Select in the gtfs db all the platforms ref used by a route
	 * @param {String} shapePk The unique identifier of the route
	 * @returns {Array.<Object>} An array with all the platforms used by the route
	 */

	async #selectPlatformsFromDb ( shapePk ) {

		const { default : theMySqlDb } = await import ( '../Gtfs2Json/MySqlDb.js' );

		const dbPlatforms = await theMySqlDb.execSql (
			'SELECT stops.stop_id AS ref ' +
            'FROM stop_times INNER JOIN stops ON stops.stop_pk = stop_times.stop_pk ' +
            'WHERE stop_times.trip_pk = ' +
            '( SELECT trips.trip_pk FROM trips WHERE trips.shape_pk = ' + shapePk + ' LIMIT 1 ) ' +
            'ORDER BY stop_times.stop_sequence;'
		);

		return dbPlatforms;
	}

	/**
	 * Select in the gtfs db all the coords ref used by a route
	 * @param {String} shapePk The unique identifier of the route
	 * @returns {String } A string with all the coords used by the route encoded with PolylineEncoder
	 */

	async #selectNodesFromDb ( shapePk ) {

		const { default : theMySqlDb } = await import ( '../Gtfs2Json/MySqlDb.js' );

		// select
		const nodes = await theMySqlDb.execSql (
			'SELECT shapes.shape_pt_lat AS lat, shapes.shape_pt_lon AS lon ' +
            'FROM shapes WHERE shapes.shape_pk = ' + shapePk + ' ' +
            'ORDER BY shapes.shape_pk, shapes.shape_pt_sequence;'
		);

		// Creating an array of array of numbers. Reminder numbers are coming as string from the db
		const nodesArray = [];
		nodes.forEach (
			node => nodesArray.push ( [ Number.parseFloat ( node.lat ), Number.parseFloat ( node.lon ) ] )
		);

		// encoding the arry with PolylineE,coder and return
		// eslint-disable-next-line no-magic-numbers
		return new PolylineEncoder ( ).encode ( nodesArray, [ 6, 6 ] );
	}

	/**
	 * Complete the route object with the nodes and platforms from the json file
	 * @param {Object} jsonRoute the route from the json file
	 */

	buildFromJson ( jsonRoute ) {
		this.#name = jsonRoute.name;
		this.#from = jsonRoute.from;
		this.#to = jsonRoute.to;
		this.#ref = jsonRoute.ref;
		this.#platforms = jsonRoute.platforms;
		this.#shapePk = jsonRoute.shapePk;
		this.#startDate = jsonRoute.startDate;
		this.#endDate = jsonRoute.endDate;
		this.#nodes = jsonRoute.nodes;
		this.#ways = jsonRoute.ways;
		this.#osmId = jsonRoute.osmId;
		this.#operator = jsonRoute.operator;
		this.#fixme = jsonRoute.fixme;

		return this;
	}

	/**
	 * Complete the route object with the nodes and platforms from the gtfs db
	 * @param {Object} dbRoute an object with the values of the route coming from the gtfs db
	 * @param {Object} network theNetwork in witch the orute is located
	 */

	async buildFromDb ( dbRoute, network ) {

		let excludeList = [];
		if ( network?.excludeList?.gtfs?.excludedPlatforms ) {
			excludeList = Array.from ( network.excludeList.gtfs.excludedPlatforms, excludedPlatform => excludedPlatform.ref );
		}

		this.#shapePk = dbRoute.shapePk;
		this.#startDate = dbRoute.startDate;
		this.#endDate = dbRoute.endDate;

		// nodes
		this.#nodes = await this.#selectNodesFromDb ( this.#shapePk );

		// platforms
		const dbPlatforms = await this.#selectPlatformsFromDb ( this.#shapePk );
		let previousPlatformRef = '';
		for ( const dbPlatform of dbPlatforms ) {
			if (
				previousPlatformRef !== dbPlatform.ref
				&&
				! excludeList.includes ( dbPlatform.ref )
			) {
				this.#platforms.push ( dbPlatform.ref );
				previousPlatformRef = dbPlatform.ref;
			}
		}

		return this;
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		Object.freeze ( this );
	}
}

export default Route;

/* --- End of file --------------------------------------------------------------------------------------------------------- */
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
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import RouteMaster from './RouteMaster.js';
import theMySqlDb from '../Gtfs2Json/MySqlDb.js';
import ArrayHelper from './ArrayHelper.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Coming soon
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class RoutesMasterTree {

	/**
	 * An array with the RouteMaster
	 * @type {Array.<RouteMaster>}
	 */

	#routesMaster = [];

	/**
	 * An object that can be used by JSON.stringify with all the routes master of the network.
	 * @type {Object}
	 */

	get jsonObject ( ) {
		const jsonRoutesMasterTree = { routesMaster : [] };
		this.#routesMaster.forEach (
			routeMaster => {
				jsonRoutesMasterTree.routesMaster.push ( routeMaster.jsonObject );
			}
		);
		Object.freeze ( jsonRoutesMasterTree.routesMaster );

		return Object.freeze ( jsonRoutesMasterTree );
	}

	/**
	 * Select in the gtfs db all the routes master in the network
	 * @param {Object} network the network for witch the routes master are searched
	 * @returns {Array.<Object>} An array with all the routes master in the network
	 */

	async #selectRoutesMasterFromDb ( network ) {

		// searching the data in the database
		const dbRoutesMaster = await theMySqlDb.execSql (
			'SELECT DISTINCT ' +
			'routes.route_short_name AS ref, ' +
			'routes.route_long_name AS description, ' +
			'routes.route_type as type ' +
			'FROM routes ' +
            'WHERE routes.agency_id = "' + network.gtfsAgencyId +
			'" AND routes.route_id like "' + network.gtfsIdPrefix + '%";'
		);

		// sorting the routes
		dbRoutesMaster.sort ( ( first, second ) => ArrayHelper.compareRouteName ( first.ref, second.ref ) );
		return dbRoutesMaster;
	}

	/**
	 * Complete the route master tree object with the routes master from the gtfs db
	 * @param {Object} network the network for witch the routes master are searched
	 */

	async #buildFromDb ( network ) {
		const dbRoutesMaster = await this.#selectRoutesMasterFromDb ( network );
		for ( const dbRouteMaster of dbRoutesMaster ) {
			const gtfsRouteMaster = new RouteMaster ( dbRouteMaster );
			await gtfsRouteMaster.build ( network );
			this.#routesMaster.push ( gtfsRouteMaster );
		}
	}

	/**
	 * Build the route master tree object
	 * @param {Object} network the network for witch the route master tree is build
	 */

	async build ( network ) {
		await this.#buildFromDb ( network );
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		Object.freeze ( this );
	}

}

export default RoutesMasterTree;

/* --- End of file --------------------------------------------------------------------------------------------------------- */
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
Doc reviewed 20250711
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import theOsmPlatforms from '../DataLoading/OsmPlatforms.js';
import theRelationsReport from '../Reports/RelationsReport.js';
import theDocConfig from '../interface/DocConfig.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Validator for the name, from, ref and to tags
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class OsmNameFromToRefValidator {

	/**
     * A flag for the errors
     * @type {boolean}
     */

	#haveErrors = false;

	/**
	 * The route currently controlled
	 * @type {Route}
	 */

	#route = null;

	/**
	 * the from platform ( = the first platform of the route)
	 * @type {Platform}
	 */

	/**
	* Validate the from tag. The from tag must be the same than the name of the first platform
	 */

	#validateFrom ( ) {
		const fromPlatform = theOsmPlatforms.getPlatform ( this.#route.platforms [ 0 ] );

		if (
			this.#route.from
			&&
			this.#route.from !== fromPlatform.name
			&&
			this.#route.from.toLowerCase ( ) !== fromPlatform.nameOperator.toLowerCase ( )
		) {
			theRelationsReport.add (
				'p',
				'Error R003: the from tag is not equal to the name of the first platform for route '
			);
			this.#haveErrors = true;
		}
	}

	/**
	* Validate the to tag. The to tag must be the same than the name of the last platform
	 */

	#validateTo ( )	{

		const toPlatform = theOsmPlatforms.getPlatform ( this.#route.platforms [ this.#route.platforms.length - 1 ] );

		if (
			this.#route.to
			&&
			this.#route.to !== toPlatform.name
			&&
			this.#route.to.toLowerCase ( ) !== toPlatform.nameOperator.toLowerCase ( )
		) {
			theRelationsReport.add (
				'p',
				'Error R005: the to tag is not equal to the name of the last platform for route'
			);
			this.#haveErrors = true;
		}
	}

	/**
	* Verify that the route have a from tag, a to tag, a name tag and a ref tag
	 */

	#haveTagsNameFromToRef ( ) {
		const haveTagsNameFromToRef =
			this.#route?.from && this.#route?.to && this.#route?.name && this.#route?.ref;

		return haveTagsNameFromToRef;
	}

	/**
	* Verify that the name is compliant with the osm rules
	 */

	#validateName ( ) {
		let vehicle = theDocConfig.vehicle.substring ( 0, 1 ).toUpperCase ( ) +
		theDocConfig.vehicle.substring ( 1 );
		if ( this.#haveTagsNameFromToRef ( ) ) {
			let goodName =
				vehicle + ' ' + this.#route.ref + ': ' +
				this.#route.from + ' → ' + this.#route.to;
			if ( this.#route.name.replaceAll ( '=>', '→' ) !== goodName ) {
				theRelationsReport.add (
					'p',
					'Error R006: Invalid name ("' + this.#route.name + '" but expected "' + goodName + '") for route '
				);
				this.#haveErrors = true;
			}
		}
	}

	/**
	 * Start the validation of name, from, to and ref tags
	 */

	validate ( ) {

		if ( ! this.#route.from ) {

			// no from tag
			theRelationsReport.add (
				'p',
				'Error R002: a from tag is not found for route'
			);
			this.#haveErrors = true;
		}

		if ( ! this.#route.to ) {

			// no to tag
			theRelationsReport.add (
				'p',
				'Error R004: a to tag is not found for route'
			);
			this.#haveErrors = true;
		}

		if ( ! this.#route.ref ) {

			// no ref tag
			theRelationsReport.add (
				'p',
				'Error R020: a ref tag is not found for route'
			);
			this.#haveErrors = true;
		}

		if ( ! this.#route.name ) {

			// no name tag
			theRelationsReport.add (
				'p',
				'Error R021: a name tag is not found for route'
			);
			this.#haveErrors = true;
		}

		this.#validateFrom ( );
		this.#validateTo ( );
		this.#validateName ( );

		return this.#haveErrors;
	}

	/**
	 * The constructor
	 * @param {Route} route the route to validate
	 */

	constructor ( route ) {
		this.#route = route;
		Object.freeze ( this );
	}
}

export default OsmNameFromToRefValidator;
import Cartesian2 from "./Cartesian2.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicProjection from "./GeographicProjection.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";

/**
 * A tiling scheme for geometry referenced to a simple {@link GeographicProjection} where
 * longitude and latitude are directly mapped to X and Y.  This projection is commonly
 * known as geographic, equirectangular, equidistant cylindrical, or plate carrée.
 *
 * @alias GeographicTilingScheme
 * @constructor
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid whose surface is being tiled. Defaults to
 * the WGS84 ellipsoid.
 * @param {Rectangle} [options.rectangle=Rectangle.MAX_VALUE] The rectangle, in radians, covered by the tiling scheme.
 * @param {Number} [options.numberOfLevelZeroTilesX=2] The number of tiles in the X direction at level zero of
 * the tile tree.
 * @param {Number} [options.numberOfLevelZeroTilesY=1] The number of tiles in the Y direction at level zero of
 * the tile tree.
 */
function GeographicTilingScheme(options) {
  /* wangfangsiqi */
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  if (
    defined(options.tileInfo) &&
    defined(options.tileInfo.spatialReference) &&
    defined(options.tileInfo.spatialReference.wkid) &&
    options.tileInfo.spatialReference.wkid == 4490
  ) {
    this._tileInfo = options.tileInfo;
    this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.CGCS2000);
    this._rectangle = defaultValue(
      options.rectangle,
      Rectangle.fromDegrees(-180, -90, 180, 90)
    );
    this._numberOfLevelZeroTilesX = defaultValue(
      options.numberOfLevelZeroTilesX,
      4
    );
    this._numberOfLevelZeroTilesY = defaultValue(
      options.numberOfLevelZeroTilesY,
      2
    );
  } else {
    this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
    this._rectangle = defaultValue(options.rectangle, Rectangle.MAX_VALUE);
    this._numberOfLevelZeroTilesX = defaultValue(
      options.numberOfLevelZeroTilesX,
      2
    );
    this._numberOfLevelZeroTilesY = defaultValue(
      options.numberOfLevelZeroTilesY,
      1
    );
  }
  this._projection = new GeographicProjection(this._ellipsoid);
}

Object.defineProperties(GeographicTilingScheme.prototype, {
  /**
   * Gets the ellipsoid that is tiled by this tiling scheme.
   * @memberof GeographicTilingScheme.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },

  /**
   * Gets the rectangle, in radians, covered by this tiling scheme.
   * @memberof GeographicTilingScheme.prototype
   * @type {Rectangle}
   */
  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },

  /**
   * Gets the map projection used by this tiling scheme.
   * @memberof GeographicTilingScheme.prototype
   * @type {MapProjection}
   */
  projection: {
    get: function () {
      return this._projection;
    },
  },
});

/**
 * Gets the total number of tiles in the X direction at a specified level-of-detail.
 *
 * @param {Number} level The level-of-detail.
 * @returns {Number} The number of tiles in the X direction at the given level.
 */
GeographicTilingScheme.prototype.getNumberOfXTilesAtLevel = function (level) {
  /* wangfangsiqi */
  if (!defined(this._tileInfo)) {
    return this._numberOfLevelZeroTilesX << level;
  }
  let currentMatrix = this._tileInfo.lods.filter(function (item) {
    return item.level === level;
  });
  let currentResolution = currentMatrix[0].resolution;
  return Math.round(
    CesiumMath.toDegrees(CesiumMath.TWO_PI) /
      (this._tileInfo.rows * currentResolution)
  );
};

/**
 * Gets the total number of tiles in the Y direction at a specified level-of-detail.
 *
 * @param {Number} level The level-of-detail.
 * @returns {Number} The number of tiles in the Y direction at the given level.
 */
GeographicTilingScheme.prototype.getNumberOfYTilesAtLevel = function (level) {
  /* wangfangsiqi */
  if (!defined(this._tileInfo)) {
    return this._numberOfLevelZeroTilesY << level;
  }
  let currentMatrix = this._tileInfo.lods.filter(function (item) {
    return item.level === level;
  });
  let currentResolution = currentMatrix[0].resolution;
  return Math.round(
    CesiumMath.toDegrees(CesiumMath.TWO_PI / 2) /
      (this._tileInfo.cols * currentResolution)
  );
};

/**
 * Transforms a rectangle specified in geodetic radians to the native coordinate system
 * of this tiling scheme.
 *
 * @param {Rectangle} rectangle The rectangle to transform.
 * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
 *          is undefined.
 */
GeographicTilingScheme.prototype.rectangleToNativeRectangle = function (
  rectangle,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("rectangle", rectangle);
  //>>includeEnd('debug');

  const west = CesiumMath.toDegrees(rectangle.west);
  const south = CesiumMath.toDegrees(rectangle.south);
  const east = CesiumMath.toDegrees(rectangle.east);
  const north = CesiumMath.toDegrees(rectangle.north);

  if (!defined(result)) {
    return new Rectangle(west, south, east, north);
  }

  result.west = west;
  result.south = south;
  result.east = east;
  result.north = north;
  return result;
};

/**
 * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
 * of the tiling scheme.
 *
 * @param {Number} x The integer x coordinate of the tile.
 * @param {Number} y The integer y coordinate of the tile.
 * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
 *          if 'result' is undefined.
 */
GeographicTilingScheme.prototype.tileXYToNativeRectangle = function (
  x,
  y,
  level,
  result
) {
  const rectangleRadians = this.tileXYToRectangle(x, y, level, result);
  rectangleRadians.west = CesiumMath.toDegrees(rectangleRadians.west);
  rectangleRadians.south = CesiumMath.toDegrees(rectangleRadians.south);
  rectangleRadians.east = CesiumMath.toDegrees(rectangleRadians.east);
  rectangleRadians.north = CesiumMath.toDegrees(rectangleRadians.north);
  return rectangleRadians;
};

/**
 * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
 *
 * @param {Number} x The integer x coordinate of the tile.
 * @param {Number} y The integer y coordinate of the tile.
 * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {Object} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
 *          if 'result' is undefined.
 */
GeographicTilingScheme.prototype.tileXYToRectangle = function (
  x,
  y,
  level,
  result
) {
  /* wangfangsiqi */
  const rectangle = this._rectangle;

  let west = 0;
  let east = 0;

  let north = 0;
  let south = 0;

  if (defined(this._tileInfo)) {
    let currentMatrix = this._tileInfo.lods.filter(function (item) {
      return item.level === level;
    });
    let currentResolution = currentMatrix[0].resolution;

    north =
      this._tileInfo.origin.y - y * (this._tileInfo.cols * currentResolution);
    west =
      this._tileInfo.origin.x + x * (this._tileInfo.rows * currentResolution);

    south =
      this._tileInfo.origin.y -
      (y + 1) * (this._tileInfo.cols * currentResolution);
    east =
      this._tileInfo.origin.x +
      (x + 1) * (this._tileInfo.rows * currentResolution);

    west = CesiumMath.toRadians(west);
    north = CesiumMath.toRadians(north);
    east = CesiumMath.toRadians(east);
    south = CesiumMath.toRadians(south);
  } else {
    let xTiles = this.getNumberOfXTilesAtLevel(level);
    let yTiles = this.getNumberOfYTilesAtLevel(level);

    const xTileWidth = rectangle.width / xTiles;
    west = x * xTileWidth + rectangle.west;
    east = (x + 1) * xTileWidth + rectangle.west;

    const yTileHeight = rectangle.height / yTiles;
    north = rectangle.north - y * yTileHeight;
    south = rectangle.north - (y + 1) * yTileHeight;
  }

  if (!defined(result)) {
    result = new Rectangle(west, south, east, north);
  }

  result.west = west;
  result.south = south;
  result.east = east;
  result.north = north;
  return result;
};

/**
 * Calculates the tile x, y coordinates of the tile containing
 * a given cartographic position.
 *
 * @param {Cartographic} position The position.
 * @param {Number} level The tile level-of-detail.  Zero is the least detailed.
 * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
 *        should be created.
 * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
 *          if 'result' is undefined.
 */
GeographicTilingScheme.prototype.positionToTileXY = function (
  position,
  level,
  result
) {
  const rectangle = this._rectangle;
  if (!Rectangle.contains(rectangle, position)) {
    // outside the bounds of the tiling scheme
    return undefined;
  }

  /* wangfangsiqi */
  if (defined(this._tileInfo)) {
    let currentMatrix = this._tileInfo.lods.filter(function (item) {
      return item.level === level;
    });
    let currentResolution = currentMatrix[0].resolution;

    let degLon = CesiumMath.toDegrees(position.longitude);
    let degLat = CesiumMath.toDegrees(position.latitude);

    let x_4490 = Math.floor(
      (degLon - this._tileInfo.origin.x) /
        (this._tileInfo.rows * currentResolution)
    );
    let y_4490 = Math.floor(
      (this._tileInfo.origin.y - degLat) /
        (this._tileInfo.cols * currentResolution)
    );

    return new Cartesian2(x_4490, y_4490);
  }

  const xTiles = this.getNumberOfXTilesAtLevel(level);
  const yTiles = this.getNumberOfYTilesAtLevel(level);

  const xTileWidth = rectangle.width / xTiles;
  const yTileHeight = rectangle.height / yTiles;

  let longitude = position.longitude;
  if (rectangle.east < rectangle.west) {
    longitude += CesiumMath.TWO_PI;
  }

  let xTileCoordinate = ((longitude - rectangle.west) / xTileWidth) | 0;
  if (xTileCoordinate >= xTiles) {
    xTileCoordinate = xTiles - 1;
  }

  let yTileCoordinate =
    ((rectangle.north - position.latitude) / yTileHeight) | 0;
  if (yTileCoordinate >= yTiles) {
    yTileCoordinate = yTiles - 1;
  }

  if (!defined(result)) {
    return new Cartesian2(xTileCoordinate, yTileCoordinate);
  }

  result.x = xTileCoordinate;
  result.y = yTileCoordinate;
  return result;
};
export default GeographicTilingScheme;

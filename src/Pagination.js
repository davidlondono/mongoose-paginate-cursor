/**
 * Created by david on 9/22/16.
 */
import _debug from 'debug';
import Promise from 'bluebird';
const debug = _debug('mpaginate');

export default function globalSchema(schema, { name } = {}) {
  const paginate = async function paginateCursor({
    sinceId, maxId, limit = 1,
    select, where = {},
    keyID = '_id',
    keyOrder = '_id',
    reverse = false,
    map,
  } = {}, callback) {
    try {
      const lsThanE = reverse ? '$gte' : '$lte';
      const lsThan = reverse ? '$gt' : '$lt';
      const gsThan = reverse ? '$lt' : '$gt';
      const findObject = where;
      const findCursor = {};
      const sort = {};

      if (sinceId) {
        const objFound = await this.findById(sinceId);
        debug('found on sinceId', objFound);
        // find where _id is greater than the one on sinceId
        findCursor[lsThanE] = objFound[keyOrder];
        findObject[keyOrder] = findCursor;
      }

      if (maxId) {
        const objFound = await this.findById(maxId);
        debug('found on maxId', objFound);
        // find where _id is greater than the one on maxId
        findCursor[gsThan] = objFound[keyOrder];
        findObject[keyOrder] = findCursor;
      }

      sort[keyOrder] = reverse ? 1 : -1;
      let query = this.find(findObject, select)
        .sort(sort);
      if (limit) {
        query = query.limit(limit);
      }

      // map the objects if there is a map
      if (map) {
        query = Promise.resolve(query.exec()).map(map);
      } else {
        query = query.exec();
      }
      const objects = await query;
      let nextCursor = undefined;

      if (objects.length) {
        debug('objects has length', objects.length);
        const lastItem = objects[objects.length - 1];
        const lastOrderFound = lastItem[keyOrder];
        const findNextCursorWhere = where;
        const findNextCursor = {};
        findNextCursor[lsThan] = lastOrderFound;
        findNextCursorWhere[keyOrder] = findNextCursor;
        const nextObject = await this
          .findOne(findNextCursorWhere, keyID)
          .sort(sort);

        debug('found on nextObject', nextObject);
        if (nextObject) {
          nextCursor = nextObject[keyID];
        }
      }

      const objectReturn = {
        objects,
        nextCursor,
      };
      if (callback) {
        callback(null, objectReturn);
      }
      return objectReturn;
    } catch (e) {
      // to throw error on callback
      if (callback) {
        callback(e);
      }
      throw e;
    }
  };

  if (name) {
    schema.statics[name] = paginate;
  } else {
    schema.statics.paginate = paginate;
  }
}


/**
 * Created by david on 9/22/16.
 */
import Promise from 'bluebird';

export default function globalSchema(schema, { name } = {}) {
  const paginate = async function paginateCursor({
    sinceId, maxId, limit = 1,
    select, where = {},
    keyPaginated = '_id',
    orderKey = '_id',
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
        // find where _id is greater than the one on sinceId
        findCursor[lsThanE] = objFound[orderKey];
        findObject[orderKey] = findCursor;
      }

      if (maxId) {
        const objFound = await this.findById(maxId);
        // find where _id is greater than the one on maxId
        findCursor[gsThan] = objFound[orderKey];
        findObject[orderKey] = findCursor;
      }

      sort[orderKey] = reverse ? 1 : -1;
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
        const lastCursor = objects[objects.length - 1][keyPaginated];
        const findNextCursorWhere = where;
        const findNextCursor = {};
        findNextCursor[lsThan] = lastCursor;
        findNextCursorWhere[keyPaginated] = findNextCursor;
        const nextObject = await this
          .findOne(findNextCursorWhere, keyPaginated)
          .sort(sort);

        if (nextObject) {
          nextCursor = nextObject[keyPaginated];
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


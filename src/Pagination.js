/**
 * Created by david on 9/22/16.
 */

export default function globalSchema(schema, { name } = {}) {
  const paginate = async function paginateCursor({
    sinceId, maxId, limit = 1,
    select, where = {},
    keyPaginated = '_id', reverse = false,
  } = {}, callback) {
    try {
      const lsThanE = reverse ? '$gte' : '$lte';
      const lsThan = reverse ? '$gt' : '$lt';
      const gsThan = reverse ? '$lt' : '$gt';
      const findObject = where;
      const findCursor = {};
      const sort = {};

      if (sinceId) {
        findObject[keyPaginated] = findCursor;
        findCursor[lsThanE] = sinceId;
      }

      if (maxId) {
        findObject[keyPaginated] = findCursor;
        findCursor[gsThan] = maxId;
      }

      sort[keyPaginated] = reverse ? 1 : -1;
      let query = this.find(findObject, select)
        .sort(sort);
      if (limit) {
        query = query.limit(limit);
      }

      const objects = await query.exec();
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
      callback(e);
      throw e;
    }
  };

  if (name) {
    schema.statics[name] = paginate;
  } else {
    schema.statics.paginate = paginate;
  }
}


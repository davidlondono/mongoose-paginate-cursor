/**
 * Created by david on 9/22/16.
 */
import _debug from 'debug';
import Promise from 'bluebird';

const debug = _debug('mpaginate');

export default function globalSchema(schema, { name } = {}) {

  const paginate = async function paginate({
    sinceId,
    maxId,
    limit = 1,
    select,
    where = {},
    keyID = '_id',
    keyOrder = '_id',
    reverse = false,
    map,
    filter,
  } = {}) {
    const lsThanE = reverse ? '$gte' : '$lte';
    const lsThan = reverse ? '$gt' : '$lt';
    const gsThan = reverse ? '$lt' : '$gt';
    const queryParams = {
      sinceId,
      maxId,
    };

    const findAnds = [where];
    const findOrs = [];
    const queryDocumentsGeneral = {};
    const findCursorOrder = {};

    if (sinceId) {
      const findOneQuery = {};
      findOneQuery[keyID] = sinceId;
      // ejm: { count: 33 }
      const objFound = await this.findOne(findOneQuery);
      if(objFound) {
        debug('found on sinceId', objFound);
        queryParams.keyOrderSince = objFound[keyOrder];
      }
    }

    if (maxId) {
      const findOneQuery = {};
      findOneQuery[keyID] = maxId;
      const objFound = await this.findById(findOneQuery);
      if(objFound) {
        debug('found on maxId', objFound);
        // find where _id is greater than the one on maxId
        findCursorOrder[gsThan] = objFound[keyOrder];
        queryDocumentsGeneral[keyOrder] = findCursorOrder;
      }
    }
    queryDocumentsGeneral.$and = findAnds;
    //queryDocumentsGeneral.$or = findOrs;

    const sort = {};
    sort[keyOrder] = reverse ? 1 : -1;
    if(keyID != keyOrder) {
      sort[keyID] = reverse ? 1 : -1;
    }
    const calculateNewQuery = () => {
      const queryEnd = {};
      const queryOrs = [];
      if(queryParams.keyOrderSince) {
        // ejm: { id: {$lt: sinceId}, count: 33 }
        const equalOrderSince = {};
        // ejm: {$lt: sinceId}
        const querySinceId = {};
        querySinceId[lsThanE] = queryParams.sinceId;
        equalOrderSince[keyID] = querySinceId;
        debug('calculateNewQuery querySinceId', querySinceId);
        equalOrderSince[keyOrder] = queryParams.keyOrderSince;
        queryOrs.push(equalOrderSince);
        /////


        // ejm: {$lte: 33}
        const orderSinceEql = {};
        orderSinceEql[lsThan] = queryParams.keyOrderSince;
        // ejm: { count: { $lte: 33 } }
        const lessOrderSince = {};
        debug('calculateNewQuery orderSinceEql', orderSinceEql);
        lessOrderSince[keyOrder] = orderSinceEql;
        queryOrs.push(lessOrderSince);
      }
      if (queryOrs.length) {
        queryEnd.$or = queryOrs;
      }
      debug('calculateNewQuery', queryEnd);
      return queryEnd;
    };
    /**
     * find with query and map it
     * @param limitFind
     * @return {*}
     */
    const findWithLimit = async (limitFind) => {
      const queryObj = calculateNewQuery();
      debug('will findWithLimit', { where: queryObj, limit: limitFind, select });
      let query = this.find(queryObj, select)
        .sort(sort);
      if (limitFind) {
        query = query.limit(limitFind);
      }

      const objectsFirstFound = await query.exec();
      let mappedObjects;
      // map the objects if there is a map
      if (map) {
        mappedObjects = await Promise.resolve(objectsFirstFound).map(map);
      } else {
        mappedObjects = objectsFirstFound;
      }
      return mappedObjects;
    };


    let objects = [];
    let limitObjects = limit;
    if (filter) {
      let objToFilter = await findWithLimit(limit);

      // loop once to apply the filter
      do {
        // filter objects found that has not been filtered
        const objectsFiltered = await Promise.resolve(objToFilter).filter(filter);

        // add filtered objects to final array
        objects = objects.concat(objectsFiltered);

        const lastIndex = objToFilter.length - 1;
        const lastOrderValue = objToFilter[lastIndex][keyOrder];

        // set the limit to get the missing objects filtered
        limitObjects -= objectsFiltered.length;
        debug(`filtered ${limitObjects} element(s)`);
        if (limitObjects <= 0) {
          break;
        }
        // set the cursor to search AFTER the last found
        queryParams.sinceId = lastOrderValue;

        // get the new objects from the model list
        objToFilter = await findWithLimit(limitObjects);

        debug(`${objToFilter.length} element(s) to replace with filter`);
        // while the limit has items to get and the found objects to fetch and filter
      } while (limitObjects > 0 && objToFilter.length > 0);
    } else {
      // if there is no filter set objects found
      objects = await findWithLimit(limit);
    }

    let nextCursor;

    if (objects.length) {
      debug('objects has length', objects.length);
      const lastItem = objects[objects.length - 1];
      const lastOrderFound = lastItem[keyOrder];
      let nextObject;
      queryParams.sinceId = lastItem[keyID];
      queryParams.keyOrderSince = lastItem[keyOrder]
      const findNextWithSameOrder = calculateNewQuery();

      debug('find nextCursor with', { where: findNextWithSameOrder, select: keyID});
      nextObject = await this
          .findOne(findNextWithSameOrder, keyID)
          .sort(sort).skip(1);


      debug('found on nextObject', nextObject);
      if (nextObject) {
        nextCursor = nextObject[keyID];
        debug('nextCursor found', nextCursor);
      } else {
        debug('nextCursor no found');
      }
    }

    const objectReturn = {
      objects,
      nextCursor,
    };
    return objectReturn;
  };

  if (name) {
    schema.statics[name] = paginate;
  } else {
    schema.statics.paginate = paginate;
  }
}


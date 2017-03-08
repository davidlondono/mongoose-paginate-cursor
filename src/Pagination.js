/**
 * Created by david on 9/22/16.
 */
import _debug from 'debug';
import _ from 'lodash';
import Promise from 'bluebird';

const debug = _debug('mpaginate:info');
const debugData = _debug('mpaginate:data');

export default function globalSchema(schema, { name } = {}) {
  const paginate = async function paginate({
    sinceId,
    maxId,
    limit = 1,
    page = 0,
    select,
    where = {},
    keyID = '_id',
    keyOrder = '_id',
    reverse = false,
    map,
    filter,
  } = {}) {

    debug('will paginate', {
      sinceId,
      maxId,
      limit,
      select,
      where,
      keyID,
      keyOrder,
      reverse,
      map,
      filter,
    });
    const lsThanE = reverse ? '$gte' : '$lte';
    const lsThan = reverse ? '$gt' : '$lt';
    const gsThan = reverse ? '$lt' : '$gt';
    const queryParams = {
      sinceId,
      maxId,
    };


    if (sinceId) {
      const findOneQuery = {};
      findOneQuery[keyID] = sinceId;
      // ejm: { count: 33 }
      const objFound = await this.findOne(findOneQuery);
      if (objFound) {
        debug('found on sinceId', objFound);
        queryParams.keyOrderSince = objFound[keyOrder];
      }
    }

    if (maxId) {
      const findOneQuery = {};
      findOneQuery[keyID] = maxId;
      const objFound = await this.findOne(findOneQuery);
      if (objFound) {
        debug('found on maxId', objFound);
        // find where _id is greater than the one on maxId
        queryParams.keyOrderMax = objFound[keyOrder];
      }
    }
    // queryDocumentsGeneral.$or = findOrs;

    const sort = {};
    sort[keyOrder] = reverse ? 1 : -1;
    if (keyID !== keyOrder) {
      sort[keyID] = reverse ? 1 : -1;
    }
    const equalKeys = (keyID === keyOrder);
    const calculateNewQuery = () => {
      const queryEnd = {};
      // ejm: { $lt: 55, $gt: 55 }
      const middleRangeQueryOrder = {};
      const queryOrs = [];
      const queryAnds = [];
      const keyOrderMax = queryParams.keyOrderMax;
      const keyOrderSince = queryParams.keyOrderSince;

      if (!_.isNil(keyOrderSince)) {
        // high range
        // ejm: { id: {$lt: sinceId}, count: 55 }
        const equalOrderSince = {};
        // ejm: {$lt: sinceId}
        const querySinceId = {};
        querySinceId[lsThanE] = queryParams.sinceId;
        if (!_.isNil(queryParams.sinceIdExclusive)) {
          querySinceId[lsThan] = queryParams.sinceIdExclusive;
        }
        equalOrderSince[keyID] = querySinceId;
        if (!equalKeys) {
          _.set(equalOrderSince, keyOrder, keyOrderSince);
          // equalOrderSince[keyOrder] = keyOrderSince;
        }
        debug('calculateNewQuery querySinceId', querySinceId);
        if (keyOrderMax === keyOrderSince || equalKeys) {
          queryAnds.push(equalOrderSince);
        } else {
          queryOrs.push(equalOrderSince);
          // middle range
          // ejm: {$lt: 55}
          middleRangeQueryOrder[lsThan] = queryParams.keyOrderSince;
        }
      }
      if (!_.isNil(keyOrderMax)) {
        // ejm: { id: {$gt: sinceId}, count: 33 }
        const equalOrderMax = {};
        // ejm: {$lt: sinceId}
        const queryMaxId = {};
        queryMaxId[gsThan] = queryParams.maxId;
        equalOrderMax[keyID] = queryMaxId;
        if (!equalKeys) {
          _.set(equalOrderMax, keyOrder, keyOrderMax);
          // equalOrderMax[keyOrder] = keyOrderMax;
        }
        debug('calculateNewQuery queryMaxId', queryMaxId);
        if (keyOrderMax === keyOrderSince || equalKeys) {
          queryAnds.push(equalOrderMax);
        } else {
          queryOrs.push(equalOrderMax);
          // middle range
          // ejm: {$gt: 33 }
          middleRangeQueryOrder[gsThan] = queryParams.keyOrderMax;
        }
      }
      if (!_.isEmpty(middleRangeQueryOrder)) {
        const queryOrderMiddle = {};
        _.set(queryOrderMiddle, keyOrder, middleRangeQueryOrder);
        // queryOrderMiddle[keyOrder] = middleRangeQueryOrder;
        queryOrs.push(queryOrderMiddle);
      }
      if (queryOrs.length) {
        queryAnds.push({
          $or: queryOrs,
        });
      }
      if (!_.isEmpty(where)) {
        queryAnds.push(where);
      }
      if (queryAnds.length) {
        queryEnd.$and = queryAnds;
      }
      debug('calculateNewQuery', JSON.stringify(queryEnd));
      return queryEnd;
    };
    /**
     * find with query and map it
     * @param limitFind
     * @return {*}
     */
    const findWithLimit = async (limitFind, pageFind) => {
      const queryObj = calculateNewQuery();
      debug('will findWithLimit', { where: queryObj, limit: limitFind, select });
      let query = this.find(queryObj, select)
        .sort(sort);
      if (limitFind) {
        query = query.limit(limitFind);
        if (pageFind) {
          query = query.skip(limitFind * pageFind);
        }
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
    let limitObjects = parseInt(limit, 10) || 1;

    // FILTER
    if (filter) {
      let objToFilter = await findWithLimit(limit, page);
      const objectsFoundFirst = objToFilter.length;
      if (objectsFoundFirst < limitObjects) {
        limitObjects = objectsFoundFirst;
      }
      let iterationCount = 0;
      // loop once to apply the filter
      do {
        debugData(`iteration ${iterationCount}, data`, objToFilter);
        // filter objects found that has not been filtered
        const objectsFiltered = await Promise.resolve(objToFilter).filter(filter);

        debugData(`iteration ${iterationCount}, data filtered`, objectsFiltered);
        // add filtered objects to final array
        objects = objects.concat(objectsFiltered);


        // set the limit to get the missing objects filtered
        limitObjects -= objectsFiltered.length;
        debug(`filtered ${limitObjects} element(s)`);
        if (limitObjects <= 0) {
          break;
        }
        const lastIndex = objToFilter.length - 1;
        const lastOrderValue = _.get(objToFilter[lastIndex], keyOrder);
        const lastOrderID = objToFilter[lastIndex][keyID];
        // set the cursor to search AFTER the last found
        queryParams.sinceIdExclusive = lastOrderID;
        queryParams.keyOrderSince = lastOrderValue;
        // get the new objects from the model list
        objToFilter = await findWithLimit(limitObjects);

        debug(`${objToFilter.length} element(s) to replace with filter`);
        // while the limit has items to get and the found objects to fetch and filter
        iterationCount += 1;
      } while (limitObjects > 0 && objToFilter.length > 0);
    } else {
      // if there is no filter set objects found
      objects = await findWithLimit(limit, page);
    }

    let nextCursor;

    if (objects.length) {
      debug('objects has length', objects.length);
      const lastItem = objects[objects.length - 1];
      queryParams.sinceId = lastItem[keyID];
      queryParams.keyOrderSince = _.get(lastItem, keyOrder);
      const findNextWithSameOrder = calculateNewQuery();

      debug('find nextCursor with', { where: findNextWithSameOrder, select: keyID });
      const nextObject = await this
          .findOne(findNextWithSameOrder, keyID)
          .sort(sort).skip(1);


      debug('found on nextObject', nextObject);
      if (!_.isNil(nextObject)) {
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


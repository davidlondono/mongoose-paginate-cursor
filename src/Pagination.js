/**
 * Created by david on 9/22/16.
 */
const _debug = require('debug');
const _ = require('lodash');

const debug = _debug('mpaginate:info');

function globalSchema(schema, { name } = {}) {
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
    lean = false,
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
      const objFound = await this.findOne(findOneQuery, `${keyOrder}`).lean();
      if (objFound) {
        debug('found on sinceId', objFound);
        queryParams.keyOrderSince = objFound[keyOrder];
      }
    }

    if (maxId) {
      const findOneQuery = {};
      findOneQuery[keyID] = maxId;
      const objFound = await this.findOne(findOneQuery, `${keyOrder}`).lean();
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
      const { keyOrderMax, keyOrderSince } = queryParams;

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
      if (lean) {
        query = query.lean();
      }

      const objectsFirstFound = await query.exec();
      return objectsFirstFound;
    };


    const limitObjects = parseInt(limit, 10) || 1;

    const objects = await findWithLimit(limitObjects, page);

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
        .sort(sort).skip(1).lean();


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

module.exports = globalSchema;

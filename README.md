# mongoose-paginate-cursor 
[![Build Status](https://travis-ci.org/davidlondono/mongoose-paginate-cursor.svg?branch=master)](https://travis-ci.org/davidlondono/mongoose-paginate-cursor)
[![codecov](https://codecov.io/gh/davidlondono/mongoose-paginate-cursor/branch/master/graph/badge.svg)](https://codecov.io/gh/davidlondono/mongoose-paginate-cursor)
[![npm](https://img.shields.io/npm/dm/mongoose-paginate-cursor.svg?maxAge=2592000)](https://www.npmjs.com/package/mongoose-paginate-cursor)
[![License](https://img.shields.io/npm/l/mongoose-paginate-cursor.svg?maxAge=2592000?style=plastic)](https://github.com/davidlondono/mongoose-paginate-cursor/blob/master/LICENSE)


## Installation

`npm install mongoose-paginate-cursor`

## Usage
```js
// body parser
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-cursor');

var ModelSchema = mongoose.Schema({
  title: String,
  count: Number
});

ModelSchema.plugin(mongoosePaginate,{
  // name: 'paged' // custom name of paginate function
})

var Model = mongoose.model('MyModel', ModelSchema);

var paged = await Model.paginate({
  sinceId, // from what value to get documents (default: null)
  maxId, // to what value to get documents (default: null)
  limit, //amount of documents to get on search (default: 1)
  select, //what values get on request
  where, // query to match the search
  keyPaginated, //key to paginate on document (ejm: 'count' ) (default: '_id')
  reverse, //tell the pagination to reverse the search
});

paged.objects // objects found
paged.nextCursor // the key value of the next cursor
```
`.paginate()` returns a promise, or can be used with a callback
`.paginate({},callback)`

## Features to have
- [ ] Map: *let the user map the documents*
- [ ] QueryMap: *let the user map the query to add chain calls*
- [ ] Filter: *filter documents and search more to reach the limit*
- [ ] beforeCursor: *cursor for before request*

### License: MIT

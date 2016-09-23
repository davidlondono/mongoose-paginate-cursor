/**
 * Created by david on 9/22/16.
 */

import mongoose from 'mongoose';
export const db = mongoose
  .connect(process.env.MONGO_DB_URI || 'mongodb://localhost/mongoose_cursor');

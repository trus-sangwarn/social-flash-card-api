const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const AccessTokenSchema = new Schema({
  token: String,
  userId: { type: ObjectId, ref: 'User' },
});

module.exports = mongoose.model('AccessToken', AccessTokenSchema);
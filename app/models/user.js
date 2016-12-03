const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema({
  name: String,
  username: String,
  password: String
});

module.exports = mongoose.model('User', UserSchema);
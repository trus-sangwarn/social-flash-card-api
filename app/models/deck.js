const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const DeckSchema = new Schema({
  name: String,
  cards: [{
    front: String,
    back: String
  }],
  author: String,
  userId: { type: ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  tags: [String]
});

module.exports = mongoose.model('Deck', DeckSchema);
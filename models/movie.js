var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var movieSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  year: String,
  genre: [String],
  mpaa_rating: String,
  critics_consensus: String,
  ratings:{
  		critics_rating: String,
  		critics_score: Number,
  		audience_rating: String,
  		audience_score: Number
  	},
  directors: String,
  posters:{
  		thumbnail: String,
  		profile: String,
  		detailed: String,
  		original: String
  	},
  createDate: {type: Date,default:Date.now},
  owner:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  creator: String,
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }],
  likers:[String],
  comments:[{
  		isPublic: Boolean,
  		comment: String,
  		publisher: String
 // 		type: mongoose.Schema.Types.ObjectId, ref: 'User'
  	}]
});

module.exports = mongoose.model('Movie', movieSchema);
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');

var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var jwt = require('jwt-simple');
var moment = require('moment');

var async = require('async');
var request = require('request');
var xml2js = require('xml2js');

var agenda = require('agenda')({ db: { address: 'localhost:27017/test' } });
var sugar = require('sugar');
var nodemailer = require('nodemailer');
var _ = require('lodash');
//google code challenge



var tokenSecret = 'your unique secret';
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

var userSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: String
});

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};
var User = mongoose.model('User', userSchema);
var Movie = mongoose.model('Movie', movieSchema);

//var User = require('./models/User');
//var Movie = require('./models/Movie');
mongoose.connect('mongodb://127.0.0.1:27017/test');
//mongoose.connect('localhost');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

function ensureAuthenticated(req, res, next) {
  if (req.headers.authorization) {
    var token = req.headers.authorization.split(' ')[1];
    try {
      var decoded = jwt.decode(token, tokenSecret);
      if (decoded.exp <= Date.now()) {
        res.send(400, 'Access token has expired');
      } else {
        req.user = decoded.user;
        return next();
      }
    } catch (err) {
      return res.send(500, 'Error parsing token');
    }
  } else {
    return res.send(401);
  }
}

function createJwtToken(user) {
  var payload = {
    user: user,
    iat: new Date().getTime(),
    exp: moment().add('days', 7).valueOf()
  };
  return jwt.encode(payload, tokenSecret);
}

var fs = require('fs');
var jsonfile = require('jsonfile')
var gplusUserSchema = new mongoose.Schema({
		_id: String, //key for input.json
		circles:[String],
		name: String,
		numPosts:Number,
		numPlusOnes:Number,
		email:String,
		userWeight: Number,
		StorageTB: Number
});
var gplusUserTable = mongoose.model('gplusUser', gplusUserSchema);

app.get('/saveMongoDB', function(req,res){
	
fs.readFile('sample_input.json','utf8',function(err,data){
		if(err) throw err;
		var gplusData = JSON.parse(data);
		if(gplusData != null){
				for (var keyId in gplusData){
					var gplusUser = gplusData[keyId];
					var user = new gplusUserTable({
						_id: keyId,
						name: gplusUser.name,
						numPosts: gplusUser.numPosts,
						numPlusOnes:gplusUser.numPlusOnes,
						circles: gplusUser.circles,
						email:gplusUser.email,
						userWeight:gplusUser.numPlusOnes
					});
					user.save(function (err) {
			      if (err) throw err
//				    console.log("user saved!");
				  });
				}
			}
			
		
		//console.log(gplusData);
	});

	});
app.get('/assignstorage',function(req,res){
	fs.readFile('sample_input.json','utf8',function(err,data){
		if(err) throw err;
		var gplusData = JSON.parse(data);
			if(gplusData != null){
				//get userlist size
				var userCount = Object.keys(gplusData).length;
				//initial average storage size
				var initialStorage = Math.floor(3000/userCount);//leave buffer storage to assgin based on different ranking
				console.log(userCount,initialStorage);
				/*calculate weight for assgining space
				/*rules: 
				*/
				/*sort the user and output the js file
				*/
				var sortedOutput=[];
				Object.keys(gplusData).sort().forEach(function(key) {
  									//console.log(key);
  									var storage =initialStorage +Math.ceil((gplusData[key].numPlusOnes*100)/userCount);
  									var temp = key +': '+storage;  									
  									sortedOutput.push(temp);
  									
				});
				
  			console.log(sortedOutput);
				var file = 'output_file.json';
 
				jsonfile.writeFile(file, sortedOutput, {spaces: 2}, function(err) {
				  	if (err) throw err;
				});
								
			}
	});	
});
	
app.post('/auth/signup', function(req, res, next) {
  var user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });
  user.save(function(err) {
    if (err) return next(err);
    res.send(200);
  });
});

app.post('/auth/login', function(req, res, next) {
  User.findOne({ email: req.body.email }, function(err, user) {
    if (!user) return res.send(401, 'User does not exist');
    user.comparePassword(req.body.password, function(err, isMatch) {
      if (!isMatch) return res.send(401, 'Invalid email and/or password');
      var token = createJwtToken(user);
      res.send({ token: token });
    });
  });
});


app.get('/api/users', function(req, res, next) {
  if (!req.query.email) {
    return res.send(400, { message: 'Email parameter is required.' });
  }

  User.findOne({ email: req.query.email }, function(err, user) {
    if (err) return next(err);
    res.send({ available: !user });
  });
});



app.get('/api/shows', function(req, res, next) {
  var query = Movie.find();
  if (req.query.genre) {
    query.where({ genre: req.query.genre });
  } else if (req.query.alphabet) {
    query.where({ name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i') });
  } else {
    query.limit(10);
  }
  query.exec(function(err, shows) {
    if (err) return next(err);
    res.send(shows);
  });
});

app.get('/api/shows/:id', function(req, res, next) {
  Movie.findById(req.params.id, function(err, show) {
    if (err) return next(err);
    res.send(show);
  });
});

app.get('/api/mylist/:owner', function(req, res, next) {
	console.log('!!!!!!!!!!'+req.params.owner);
  var query = Movie.find({$or:[{owner: req.params.owner},{subscribers: req.params.owner}]});

  query.exec(function(err, movies) {
    if (err) return next(err);
    console.log(movies);
    res.send(movies);
  });
});
app.post('/api/shows', ensureAuthenticated, function (req, res, next) {
  var seriesName = req.body.showName
    .toLowerCase();
  var apiKey = 'dx2pbuj67ms6dwxxmnwgb8zr';
  var apiUrl = 'http://api.rottentomatoes.com/api/public/v1.0/';
  var baseUrl = 'http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey='+apiKey+'&q=';
  console.log(req.user.name);
	async.waterfall([
    function (callback) {
    	console.log('#####'+baseUrl + seriesName);
      request.get(baseUrl + seriesName, function (error, response, body) {
      	
        if (error) return next(error);
        var jsonData = JSON.parse(body);
        
        console.log("-----"+jsonData.total);
        if(jsonData.total>0){
        		var movieId = jsonData.movies[0].id;
        		console.log("-----"+movieId);
          	callback(null, movieId);
        	}else{
        		return res.send(400, { message: req.body.showName + ' was not found.' });
        	}
      });
    },function (movieId, callback) {
      request.get('http://api.rottentomatoes.com/api/public/v1.0/movies/' + movieId + '.json?apikey=' + apiKey, function (error, response, body) {
        if (error) return next(error);
         	
				console.log(req.user);
				
        var jsonData = JSON.parse(body);
          	
				console.log(jsonData);
        //get movie information, create new movie object to save into mongodb
        var movie = new Movie({
        		_id: movieId,
        		name: jsonData.title,
        		year: jsonData.year,
        		genres: jsonData.genres,
        		mpaa_rating: jsonData.mpaa_rating,
        		directors: jsonData.abridged_directors[0].name,
        		critics_consensus: jsonData.critics_consensus,
        		ratings:{
        				critics_rating: jsonData.ratings.critics_rating,
        				critics_score: jsonData.ratings.critics_score,
        				audience_rating: jsonData.ratings.audience_rating,
        				audience_score: jsonData.ratings.audience_score
        			},
        		posters:{thumbnail: jsonData.posters.thumbnail,
				        			profile: jsonData.posters.profile,
								  		detailed: jsonData.posters.detailed,
								  		original: jsonData.posters.original},
        		creator: req.user.name,
        		owner: req.user._id        		
        	});
        	movie.likers.push(req.user.name); 
        	movie.subscribers.push(req.user._id); 
//        	movie.rating.critics_rating.push(jsonData.rating.critics_rating);      	
				console.log(movie);
				callback(error, movie);
      });
    }], function (err, movie) {
    	console.log("save movie!"+movie);
    if (err) return next(err);
    movie.save(function (err) {
      if (err) {
        if (err.code == 11000) {
          return res.send(409, { message: movie.name + ' already exists.' });
        }
        return next(err);
      }
      console.log("save movie!");
      res.send(200);
    });
  });
});
app.post('/api/subscribe', ensureAuthenticated, function(req, res, next) {
  Movie.findById(req.body.showId, function(err, movie) {
    if (err) return next(err);
    movie.subscribers.push(req.user._id);
    movie.likers.push(req.user.name);
    movie.save(function(err) {
      if (err) return next(err);
      res.send(200);
    });
  });
});

app.post('/api/unsubscribe', ensureAuthenticated, function(req, res, next) {
  Movie.findById(req.body.showId, function(err, movie) {
    if (err) return next(err);
    var index = movie.subscribers.indexOf(req.user._id);
    var liker = movie.likers.indexOf(req.user.name);
    movie.subscribers.splice(index, 1);
    movie.likers.splice(liker, 1);
    movie.save(function(err) {
      if (err) return next(err);
      res.send(200);
    });
  });
});
app.post('/api/comment', function(req, res, next){
	console.log(req.body);
	console.log(req.body.isPublic+req.body.comment+req.body.publisher);
	Movie.findById(req.body.showId, function(err, movie){
			if(err) return next(err);
//			movie.comments.isPublic = req.body.isPublic;
//			movie.comments.comment = req.body.comment;
//			movie.comments.publisher = req.body.publisher;
			movie.comments.push({isPublic: req.body.isPublic, comment: req.body.comment, publisher:req.body.publisher});
			movie.save(function(err){
					if(err) return next(err);
					res.send(200);
				});
			console.log('comment saved!');
		});

});
//app.get('*', function(req, res) {
//  res.redirect('/#' + req.originalUrl);
//});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, { message: err.message });
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

agenda.define('send email alert', function(job, done) {
  Movie.findOne({ name: job.attrs.data }).populate('subscribers').exec(function(err, show) {
    var emails = Movie.subscribers.map(function(user) {
      if (user.facebook) {
        return user.facebook.email;
      } else if (user.google) {
        return user.google.email
      } else {
        return user.email
      }
    });

    var upcomingEpisode = Movie.episodes.filter(function(episode) {
      return new Date(episode.firstAired) > new Date();
    })[0];

    var smtpTransport = nodemailer.createTransport('SMTP', {
      service: 'SendGrid',
      auth: { user: 'hslogin', pass: 'hspassword00' }
    });

    var mailOptions = {
      from: 'Fred Foo ✔ <foo@blurdybloop.com>',
      to: emails.join(','),
      subject: Movie.name + ' is starting soon!',
      text: Movie.name + ' starts in less than 2 hours on ' + Movie.network + '.\n\n' +
        'Episode ' + upcomingEpisode.episodeNumber + ' Overview\n\n' + upcomingEpisode.overview
    };

    smtpTransport.sendMail(mailOptions, function(error, response) {
      console.log('Message sent: ' + response.message);
      smtpTransport.close();
      done();
    });
  });
});

//agenda.start();

agenda.on('start', function(job) {
  console.log("Job %s starting", job.attrs.name);
});

agenda.on('complete', function(job) {
  console.log("Job %s finished", job.attrs.name);
});
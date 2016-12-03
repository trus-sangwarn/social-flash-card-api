'use strict';
// BASE SETUP
// =============================================================================

// call the packages we need
const express    = require('express');
const bodyParser = require('body-parser');
const randomstring = require('randomstring');
const app        = express();
const morgan     = require('morgan');
const cookieParser = require('cookie-parser');
const Cookies = require('cookies');

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const port = process.env.PORT || 3000; // set our port

const mongoose   = require('mongoose');
mongoose.Promise = global.Promise;
// mongoose.connect('mongodb://localhost:27017/social_flash_card'); // connect to our database
mongoose.connect('mongodb://test:1234@ds119618.mlab.com:19618/heroku_bgjmjc45');
const Deck = require('./app/models/deck');
const User = require('./app/models/user');
const AccessToken = require('./app/models/access-token');

app.all("/api/*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  return next();
});
// ROUTES FOR OUR API
// =============================================================================

// create our router
const router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
  let token;
  // const cookies = new Cookies(req, res);
  // const accessToken = cookies.get('accessToken');
  if (accessToken) {
  	// token = accessToken;
    token = req.cookies.accessToken;
    console.log(token);
  }
  if (req.get('X-Access-Token')) {
    token = req.get('X-Access-Token');
  }
  if (token) {
  	console.log(token);
    AccessToken.findOne({ token })
    .populate('userId')
    .then((accessToken) => {
      if (accessToken) return Promise.resolve(accessToken.userId);
      res.clearCookie('accessToken', { path: '/' });
      return Promise.resolve();
    })
    .then((user) => {
      if (!user) {
        next();
        return;
      }
      if (req.cookies.accessToken !== token) {
        res.cookie('accessToken', token);
      }
      user.save();
      req.token = token;
      req.user = user;
      next();
    }).catch((err) => {
      res.clearCookie('accessToken', { path: '/' });
      res.status(403).send(err.message);
    });
  } else {
    next();
  }
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.send({ message: 'Hello!' });
});

router.post('/login', (req, res) => {
	User.findOne({
		username: req.body.username,
		password: req.body.password
	})
	.then((user) => {
		if(!user) {
			return res.status(500).send({ error: 'Username or password is invalid.' });
		}
		return user;
	})
	.then(user => {
		console.log(user);
		const accessToken = new AccessToken({
      userId: user._id,
      token: randomstring.generate(32)
    });
    return Promise.all([accessToken.save(), user]);
	})
	.then((data) => res.send({ accessToken: data[0].token, user: data[1] }))
	.catch(error => res.status(500).send({ error }));
});

router.delete('/logout', (req, res) => {
	AccessToken.remove({ userId: req.user._id })
	.then((data) => res.send(data))
	.catch(error => res.status(500).send({ error }));
});

router.get('/user/me', (req, res) => {
	if (!req.user) {
		return res.status(500).send({ error: 'User not found' });
	} 
	return res.send({ _id: req.user._id, name:req.user.name});
});


router.get('/home', (req, res) => {
	Deck.find()
	.then((decks) => res.send(decks))
	.catch((error) => res.status(500).send({ error }));
});

router.get('/decks', (req, res) => {
	Deck.find({ userId: req.user._id })
	.then((decks) => res.json(decks))
	.catch(error => 
		res.status(500).send({ error })
	)
});

router.post('/deck', (req, res) => {
	const deck = new Deck(req.body);
	deck.userId = req.user._id;
	deck.author = req.user.name;
	deck.save()
	.then(deck => res.send(deck))
	.catch(error =>
		res.status(500).send({ error })
	);
});

router.get('/deck/:id', (req, res) => {
	Deck.findById(req.params.id)
	.then((deck) => {
		if (!deck) {
			res.status(500).send({ error: 'Deck not found' })
		}
		return res.send(deck);
	})
	.catch((error) => res.status(500).send({ error }));
});

router.delete('/deck/:id', (req, res) => {
	Deck.remove({ _id: req.params.id })
	.then((data) => res.send(data))
	.catch((error) => res.error({ error }));
});

// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

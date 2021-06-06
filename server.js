import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';

const videoRoutes = require('./api/routes/videos');

import {jwtAuthStrategy} from './api/config/passportConfig';

let app = express();
let port = process.env.PORT || 8080;

passport.use(jwtAuthStrategy);

app.use(cors());
app.options('*', cors());
app.use(express.json({limit: "500mb", extended: true}));
app.use(passport.initialize());

// Mongoose instance connection url connection
const databaseUrl = process.env.TGD_DB_URL;
mongoose.Promise = global.Promise;

/*
 * Connect to database
*/

var connectWithRetry = function() {
    return mongoose.connect(databaseUrl, function(err) {
        if (err) {
            console.warn('Failed to connect to mongo on startup - retrying in 5 sec');
            setTimeout(connectWithRetry, 5000);
        }
    });
};
connectWithRetry();

app.set('etag', false);
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

/*
 * Routes 
 */
app.use('/videos', passport.authenticate("jwt", { session: false }), videoRoutes);
//app.use('/videos', videoRoutes);

app.listen(port);
console.log('What the Dub RESTful API server started on: ' + port);
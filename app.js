if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');

const session = require('express-session');
const MongoStore = require('connect-mongo');

const flash = require('connect-flash');
const passport = require('passport');
const localAuth = require('passport-local');
const User = require('./models/user');

//security features
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet'); //content security policy issues must be solved

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

// const dbUrl = 'mongodb://localhost:27017/camp'
// const dbUrl = process.env.DB_URL;
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/camp';

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(dbUrl);
    console.log("Mongoose open");
}

const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));
app.use(mongoSanitize({
    replaceWith: '_'
}));

//helmet
// app.use(helmet({contentSecurityPolicy: false}));

//helmet config to limit from where resources are accessed
app.use(helmet());
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
    "https://api.maptiler.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`, //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://api.maptiler.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    }),
    helmet.crossOriginEmbedderPolicy({
        policy: "credentialless"
    })
);

// const secret = 'thisshouldbeabettersecret'
// const secret = process.env.SECRET
const secret = process.env.SECRET || 'thisshouldbeabettersecret';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    //touchAfter - lazy update for the user so we dont update session on every refresh
    crypto: {
        secret: secret
    }
});

store.on("error", function(e){
    console.log("SESSION STORE ERROR", e);
})

const sessionConfig = {
    store,
    name: 'UrNotGonnaReachHere',
    secret: secret, 
    resave: false,
    saveUninitialized: false, 
    cookie: {
        httpOnly: true,
        // secure: true, on deployment we need for https
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7     
    }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session()); //session must be used before passport session

passport.use(new localAuth(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
    // res.send("Hello!");
    res.render('home');
});

//dont need this now due to seeder
// app.get('/makecampground', async (req, res)=>{
//     const camp = await new Campground({title: 'My Home', description: 'Cheap'});
//     await camp.save();
//     res.send(camp);
// })

// app.get('/fakeUser', async (req, res)=>{
//     const user = new User({email: 'hgk@gmail.com', username: 'hgk'});
//     const newUser = await User.register(user, 'pasta');
//     res.send(newUser);
// })

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not found!', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong!';
    res.status(statusCode).render('error', { err });
});

const PORT = process.env.PORT || 3000; // Use Render's assigned port or 3000 for local dev

app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});

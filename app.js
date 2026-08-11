if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const wrapAsync = require("./utils/wrapAsync.js");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/expressError.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const listingRoute = require("./routes/listing.js");
const reviewRoute = require("./routes/review.js");
const session = require("express-session");
const {MongoStore} = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require ("passport-local");
const User = require("./models/user.js");
const userRoute = require("./routes/user.js");


// const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';
const dbURL = process.env.ATLASDB_URL;

Main().then (() => {
    console.log("connected to DB");                     //Keeps the file structured like:Top → what runs, Bottom → how it works
}).catch(err => {                        
    console.log(err);
});

async function Main(){
    await mongoose.connect(dbURL);
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use (express.urlencoded({extended:true})); // app.use = use this, express.urlencoded = middleware, extended:true = convert to nested objects
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate); //app.engine() is an Express method that tells Express,"Whenever an .ejs file needs to be rendered, use the ejsMate engine instead of the default EJS engine.
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
   res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
   res.locals.currUser = req.user;
   next();
});




app.get("/", (req, res) => {
  res.redirect("/listings");
});


app.use("/listings",listingRoute);
app.use("/listings/:id/reviews",reviewRoute);
app.use("/",userRoute);



app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err,req,res,next) =>{
   let {statusCode = 500, message ="something went wrong!"} = err;
   res.status(statusCode).render("error.ejs",{message});
//    res.status(statusCode).send(message);
});


// app.get("/testListing", async (req,res) => {
//     let sampleListing = new Listing({
//         title : "New villa",
//         description : "By the sea",
//         price : 1200,
//         location : "Goa",
//         country : "India"
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.listen (8080, () => {
    console.log("server is listening to port 8080");
});

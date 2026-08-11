require("dotenv").config();

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");

const MONGO_URL = process.env.ATLASDB_URL;
Main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function Main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {

    // Delete old listings, reviews and users
    await Listing.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});

    // --------------------------------
    // CREATE 7 USERS
    // --------------------------------

    const usersData = [
        {
            username: "owner1",
            email: "owner1@gmail.com",
            password: "password123"
        },
        {
            username: "owner2",
            email: "owner2@gmail.com",
            password: "password123"
        },
        {
            username: "owner3",
            email: "owner3@gmail.com",
            password: "password123"
        },
        {
            username: "owner4",
            email: "owner4@gmail.com",
            password: "password123"
        },
        {
            username: "owner5",
            email: "owner5@gmail.com",
            password: "password123"
        },
        {
            username: "owner6",
            email: "owner6@gmail.com",
            password: "password123"
        },
        {
            username: "owner7",
            email: "owner7@gmail.com",
            password: "password123"
        }
    ];

    const users = [];

    for (let userData of usersData) {

        const user = new User({
            username: userData.username,
            email: userData.email
        });

        await User.register(user, userData.password);

        users.push(user);
    }

    console.log("7 users created");

    // --------------------------------
    // CREATE LISTINGS
    // --------------------------------

    const listings = [];

    for (let i = 0; i < initData.data.length; i++) {

        // Distribute listings between 7 owners
        const owner = users[i % users.length];

        const listing = new Listing(initData.data[i]);

        listing.owner = owner._id;

        await listing.save();

        listings.push(listing);
    }

    console.log(`${listings.length} listings created`);

    // --------------------------------
    // CREATE REVIEWS
    // --------------------------------

    const comments = [
        "Amazing place! We had a wonderful stay.",
        "Beautiful property and great location.",
        "Everything was clean and comfortable.",
        "Would definitely stay here again!",
        "The place was exactly as described.",
        "Fantastic experience!",
        "Really enjoyed our stay.",
        "The location was perfect.",
        "Beautiful property. Highly recommended!",
        "We had a great time here."
    ];

    for (let i = 0; i < listings.length; i++) {

        const listing = listings[i];

        // Find the owner of this listing
        const ownerId = listing.owner.toString();

        // Pick two OTHER users to review it
        const reviewer1 = users[(i + 1) % users.length];
        const reviewer2 = users[(i + 2) % users.length];

        const reviewers = [reviewer1, reviewer2];

        for (let j = 0; j < reviewers.length; j++) {

            const reviewer = reviewers[j];

            // Make sure owner cannot review their own listing
            if (reviewer._id.toString() === ownerId) {
                continue;
            }

            const review = new Review({
                comment: comments[(i + j) % comments.length],
                rating: 4 + ((i + j) % 2),
                author: reviewer._id
            });

            await review.save();

            // Add review ID to listing
            listing.reviews.push(review._id);
        }

        await listing.save();
    }

    console.log("Reviews created and attached to listings");
};

initDB()
    .then(() => {
        console.log("Data was initialized");
        mongoose.connection.close();
    })
    .catch((err) => {
        console.log(err);
        mongoose.connection.close();
    });
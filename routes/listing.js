const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const multer  = require('multer');
const { storage } = require("../cloudConfig.js");

const upload = multer({ storage });


const {
    isLoggedIn,
    isOwner,
    validateListing,
} = require("../middleware.js");

const listingController = require("../controller/listing.js");

// Index & Create Routes
router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        validateListing,
        upload.single('listing[image]'),
        wrapAsync(listingController.createListing));

// New Route
router.get(
    "/new",
    isLoggedIn,
    listingController.renderNewForm
);

// Show, Update & Delete Routes
router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListing)
    );

// Edit Route
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;
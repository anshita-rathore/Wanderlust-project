const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js");

const {
    isLoggedIn,
    isReviewAuthor,
    validateReview,
} = require("../middleware.js");

const reviewController = require("../controller/review.js");

// Create Review
router
    .route("/")
    .post(
        isLoggedIn,
        validateReview,
        wrapAsync(reviewController.createReview)
    );

// Delete Review
router
    .route("/:reviewId")
    .delete(
        isLoggedIn,
        isReviewAuthor,
        wrapAsync(reviewController.destroyReview)
    );

module.exports = router;
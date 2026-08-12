const Listing = require("../models/listing");

// INDEX
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

// RENDER NEW FORM
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// SHOW
module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing does not exist");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

// CREATE
module.exports.createListing = async (req, res, next) => {
    // Cloudinary image URL and filename
    let url = req.file.path;
    let filename = req.file.filename;

    // Create listing from form data
    const newListing = new Listing(req.body.listing);

    // Save image information
    newListing.image = { url, filename };

    // Save owner
    newListing.owner = req.user._id;

    // Geocode the location before saving
    try {
        const location = `${newListing.location}, ${newListing.country}`;
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;

        const response = await fetch(geoUrl, {
            headers: { "User-Agent": "Wanderlust/1.0" },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                newListing.geometry = {
                    type: "Point",
                    coordinates: [Number(data[0].lon), Number(data[0].lat)],
                };
            }
        }
    } catch (err) {
        console.log("Geocoding failed, using default coordinates:", err.message);
    }

    // Save to database
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

// EDIT FORM
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/,w_250");

    res.render("listings/edit.ejs", {listing,originalImageUrl});
};

// UPDATE
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing does not exist");
        return res.redirect("/listings");
    }

    // Track old location so we only re-geocode if it actually changed
    const oldLocation = `${listing.location}, ${listing.country}`;

    // Update fields from form data
    Object.assign(listing, req.body.listing);

    const newLocation = `${listing.location}, ${listing.country}`;

    // Update image if a new one was uploaded
    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }

    // Re-geocode only if location or country changed
    if (oldLocation !== newLocation) {
        try {
            const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocation)}`;

            const response = await fetch(geoUrl, {
                headers: { "User-Agent": "Wanderlust/1.0" },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    listing.geometry = {
                        type: "Point",
                        coordinates: [Number(data[0].lon), Number(data[0].lat)],
                    };
                }
            }
        } catch (err) {
            console.log("Geocoding failed on update:", err.message);
        }
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// DELETE
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");

    res.redirect("/listings");
};
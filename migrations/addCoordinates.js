if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const Listing = require("../models/listing");

const dbURL = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to DB");
    return updateCoordinates();
  })
  .catch(console.log);

async function main() {
  await mongoose.connect(dbURL);
}

async function updateCoordinates() {
  const listings = await Listing.find({});

  for (const listing of listings) {

    // Skip listings that already have coordinates
    const DEFAULT_COORDS = [77.209, 28.6139];

   // Skip only if listing has real (non-default) coordinates
   if (
     listing.geometry &&
     listing.geometry.coordinates &&
     listing.geometry.coordinates.length === 2 &&
     !(listing.geometry.coordinates[0] === DEFAULT_COORDS[0] &&
     listing.geometry.coordinates[1] === DEFAULT_COORDS[1])
    ) {
  console.log(`${listing.title} already has coordinates`);
  continue;
}

    try {
      const location = `${listing.location}, ${listing.country}`;

      console.log(`Searching: ${location}`);

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Wanderlust/1.0",
        },
      });

      if (!response.ok) {
        console.log(`Failed for ${listing.title}`);
        console.log(await response.text());

        // Wait before next request
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }

      const data = await response.json();

      if (data.length > 0) {
        listing.geometry = {
          type: "Point",
          coordinates: [
            Number(data[0].lon), // longitude
            Number(data[0].lat), // latitude
          ],
        };

        await listing.save();
        console.log(`${listing.title} updated`);
      } else {
        console.log(`${listing.title} not found`);
      }
    } catch (err) {
      console.log(`Error updating ${listing.title}`);
      console.log(err.message);
    }

    // Wait 1.2 seconds before the next request
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  console.log("Migration Complete");
  await mongoose.connection.close();
}
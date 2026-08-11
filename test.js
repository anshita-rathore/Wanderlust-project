const dns = require("dns");

dns.resolveSrv(
  "_mongodb._tcp.cluster0.ajlw6gm.mongodb.net",
  (err, records) => {
    console.log(err);
    console.log(records);
  }
);
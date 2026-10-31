const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const connectDB = require("./config/db");

const app = require("./app");
const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
})();

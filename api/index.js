const express = require("express");
const router = require("./routes/routes");

const app = express();
app.use(express.json());
app.use("/api/discord",router);
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}...`);
});

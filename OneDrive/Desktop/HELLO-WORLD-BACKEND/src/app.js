const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const User = require("./models/user");
const ConnectionRequestModel = require('./models/connectionRequest');
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);

connectDB()
.then(() => {
    console.log("database connection established...");

    app.listen(process.env.PORT, () => {
        console.log("our server is running on the port successfully");
    });
}).catch((err) => {
    console.log("Database cannot be connected");
});

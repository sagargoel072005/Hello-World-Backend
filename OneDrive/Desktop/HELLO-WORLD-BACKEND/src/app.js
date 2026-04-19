require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const User = require("./models/user");
const ConnectionRequestModel = require('./models/connectionRequest');
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
  })
);

const authRouter = require("./routes/auth");
const googleAuthRouter = require("./routes/googleAuth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");


app.use(passport.initialize());
app.use(passport.session());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", googleAuthRouter);

connectDB()
  .then(() => {
    console.log("database connection established...");

    app.listen(process.env.PORT, () => {
      console.log("our server is running on the port successfully");
    });
  }).catch((err) => {
    console.log("Database cannot be connected");
  });

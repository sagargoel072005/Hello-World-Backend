require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const User = require("./models/user");
const ConnectionRequestModel = require('./models/connectionRequest');
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const http = require("http");
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://connectra.shop",
    "https://www.connectra.shop"
  ],
  credentials: true,
}));

// IMPORTANT: webhook route ko raw body chahiye signature verify karne ke liye,
// isliye ye express.json() SE PEHLE aana zaroori hai, sirf isi specific path ke liye.
app.use("/payment/webhook", express.raw({ type: "application/json" }));

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
const PostRouter = require("./routes/post");
const chatRouter = require("./routes/chat");
const paymentRouter = require("./routes/payment");
const resumeRouter = require("./routes/resume");
const initializeSocket = require("./utils/socket");


app.use(passport.initialize());
app.use(passport.session());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", googleAuthRouter);
app.use("/", PostRouter);
app.use("/", chatRouter);
app.use("/", paymentRouter);
app.use("/api", require("./routes/news"));
app.use("/", resumeRouter);

const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    console.log("database connection established...");

    server.listen(process.env.PORT, "0.0.0.0",() => {
      console.log("our server is running on the port successfully");
    });
  }).catch((err) => {
    console.log("Database cannot be connected");
  });
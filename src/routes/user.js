const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const {userAuth} = require("../middlewares/auth");
const express = require("express");
const userRouter = express.Router();

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills"

userRouter.get("/user/request/received",userAuth,async(req,res)=>{
    try{
        const loggedInUser = req.user;
        const connectionRequests = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status:"interested",
        }).populate("fromUserId",USER_SAFE_DATA);

        res.json({
            message:"Data fetched successfully",
            data:connectionRequests,
        });

    }catch(err){
        res.status(400).send("ERROR: " + err.message);
    }
});

userRouter.get("/user/connections",userAuth,async(req,res)=>{
    try{
        const loggedInUser = req.user;
        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUser._id,status:"accepted"},
                {fromUserId: loggedInUser._id,status:"accepted"},
            ]
        }).populate("fromUserId",USER_SAFE_DATA).populate("toUserId",USER_SAFE_DATA);
        const data = connectionRequests.map((row)=>{
            if(row.fromUserId._id.toString()===loggedInUser._id.toString()){
                 return row.toUserId;
            }
          return row.fromUserId;
        });
        res.json({data});

    }catch(err){
        res.status(400).send("ERROR: " + err.message);
    }
});

userRouter.delete("/user/connection/remove/:userId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { userId } = req.params;

    const deleted = await ConnectionRequest.findOneAndDelete({
      $or: [
        { fromUserId: loggedInUser._id, toUserId: userId, status: "accepted" },
        { fromUserId: userId, toUserId: loggedInUser._id, status: "accepted" },
      ],
    });

    if (!deleted) {
      return res.status(404).json({ message: "Connection not found" });
    }

    res.json({ message: "Connection removed successfully" });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

userRouter.get('/stats', async (req, res) => {
  try {
    const developerCount = await User.countDocuments();
    res.json({ developers: developerCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

userRouter.get("/feed/",userAuth,async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store"); 
        const loggedInUser = req.user;
const page = parseInt(req.query.page) || 1;
let limit = parseInt(req.query.limit) || 50;
limit = limit>100 ? 100 : limit;
const skip = (page-1)*limit;
        const connectionRequests = await ConnectionRequest.find({
               $or: [
                { toUserId: loggedInUser._id},
                {fromUserId: loggedInUser._id},
            ]
        }).select("fromUserId toUserId");

        const hideUsersFromFeed = new Set();
        connectionRequests.forEach((req)=>{
            hideUsersFromFeed.add(req.fromUserId.toString());
             hideUsersFromFeed.add(req.toUserId.toString());
        });
        const users = await User.find({
            $and: [
                {_id:{ $nin : Array.from(hideUsersFromFeed)}},
                {_id:{ $ne:loggedInUser._id}},
            ],
        }).select(USER_SAFE_DATA).skip(skip).limit(limit);

        res.send(users);

    }catch(err){
        res.status(400).send("ERROR: " + err.message);
    }
});

module.exports = userRouter;
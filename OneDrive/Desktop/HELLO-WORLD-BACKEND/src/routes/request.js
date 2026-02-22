const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        const allowedStatus = ["ignored", "interested"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "INVALID STATUS TYPE: " + status });
        }

        const toUser = await User.findById(toUserId);
        if (!toUser) {
            return res.status(404).send("User not found");
        }

        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ],
        });

        if (existingConnectionRequest) {
            return res.status(400).send("connection request already exists");
        }

        const connectionRequest = new ConnectionRequest({
            fromUserId, toUserId, status,
        })

        await connectionRequest.save();
        res.json({
            success: true,
            message:
                status === "interested"
                    ? "Connection request sent successfully"
                    : "Connection request ignored successfully",
            status,
        });


    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
    try {

        const loggedInUser = req.user;
        const { status, requestId } = req.params;
        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
            return res.status(404).json({ message: "status not allowed" });
        }
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUser._id,
            status: "interested",
        });
        if (!connectionRequest) {
            return res.status(404).json({ message: "connection request not found" });
        }
connectionRequest.status = status;
const data = await connectionRequest.save();
res.json({message:"Connection request " + status,data});
    } catch (err) {
        res.status(404).send("ERROR : " + err.message);
    }
})

module.exports = requestRouter;
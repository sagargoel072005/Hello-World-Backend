const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        index: true,
        minLength: 2,
        maxLength: 20,
    },
    lastName: {
        type: String
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email address : " + value);
            }
        },
    },
password: {
    type: String,
    required: function () {
      return this.authProvider === "local";
    },
    validate(value) {
      // Google login ke liye skip
      if (this.authProvider === "google") return true;

      // Local login ke liye check
      if (!validator.isStrongPassword(value)) {
        throw new Error("Invalid Password :" + value);
      }
    },
  },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
    profilePhoto: {
        type: String,
        default: "",
    },

    age: {
        type: Number,
        min: 15,

    },
    gender: {
        type: String,
        enum: {
            values: ["male", "female", "others"],
            message: `{VALUE} is not a valid gender type`
        }
    },
    about: {
        type: String,
        default: "Hello, I am a developer",
    },

    skills: {
        type: [String],
        validate: {
            validator: function (skills) {
                return skills.length <= 10;
            },
            message: "You can add a maximum of 10 skills.",
        },
    },

    githubId: {
        type: String,
        default: "",
    },

    linkedIn: {
        type: String,
        default: "",
    },

    leetcodeId: {
        type: String,
        default: "",
    },
        TwitterId: {
        type: String,
        default: "",
    },

    PortFolio: {
        type: String,
        default: "",
    },

    projects: {
        type: [String],
        default: [],
        validate: {
            validator: function (arr) {
                return arr.length <= 10;
            },
            message: "Maximum 10 projects allowed",
        },
    },

    certifications: {
        type: [String],
        default: [],
        validate: {
            validator: function (arr) {
                return arr.length <= 10;
            },
            message: "Maximum 10 certifications allowed",
        },
    },

    academicQualifications: {
        tenth: {
            school: { type: String, default: "" },
            board: { type: String, default: "" },
            percentage: { type: Number, min: 0, max: 100 },
        },
        twelfth: {
            school: { type: String, default: "" },
            board: { type: String, default: "" },
            percentage: { type: Number, min: 0, max: 100 },
        },
        ug: {
            college: { type: String, default: "" },
            degree: { type: String, default: "" },
            branch: { type: String, default: "" },
            sgpa: { type: Number, min: 0, max: 10 },
        },
        pg: {
            college: { type: String, default: "" },
            degree: { type: String, default: "" },
            branch: { type: String, default: "" },
            sgpa: { type: Number, min: 0, max: 10 },
        },
    },

    githubToken: { type: String },
    githubUsername: { type: String },
    githubProfileUrl: { type: String },
},
    {
        timestamps: true,
    }

);

//compound index - verify fields exists in schema before using index
userSchema.index({ fromUserId: 1, toUserId: 1 });

// JWT token generation method
userSchema.methods.getJWT = async function () {
    const user = this;
    const token = await jwt.sign({ _id: user._id }, process.env.JWT_TOKEN, {
        expiresIn: "1d",
    });
    return token;
};

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;



const validator = require("validator");

const validateSignUpData = (req)=>{
    const {firstName,lastName,emailId,password} = req.body;

    if(!firstName || !lastName){
        throw new Error("name is not valid !!");
    }
    else if(firstName.length <4 || firstName.length>50){
        throw new Error("Firstname should be between 4-50 characters");
    }
    else if(!validator.isEmail(emailId)){
        throw new Error("Email is not valid !!");
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("Please Enter a strong password");
    }
}

const validateEditProfileData = (req) => {
    const allowedEditFields = ["firstName","lastName","skills","about","photoUrl","age","gender","emailId","githubId","linkedIn","leetcodeId","projects","academicQualifications","certifications"];
    const isEditAllowed = Object.keys(req.body).every((field)=>
        allowedEditFields.includes(field)
    );
    return isEditAllowed;
}

module.exports = {validateSignUpData,validateEditProfileData};
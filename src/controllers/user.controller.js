
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken =async (userId)=>{
    try {
        const user =await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
        
    } catch (error) {
        throw new ApiError(500,error?.message ||"something went wrong while generating tokens");
    }
    
}


const registerUser = asyncHandler(async (req, res, next) => {
    // get user details from frontend 
    // validate user details - check if not empty 
    // check if user already exists 
    // check if image is uploaded by user --avatar
    // upload image to cloudinary 
    // create user object and save to db
    // remove password and refresh token field fromm response 
    // check for user creation 
    // return response


    const { fullname, email, password, username } = req.body;
    // console.log("email: ", email);
    // console.log(req.body);

    if (!fullname || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { fullname }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;  if cover image is not provided then it will give error
    let coverImageLocalPath = null;
    if (req.files?.coverImage) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;}

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(500, "Could not upload avatar image, please try again");
    }

    const user = await User.create({
        fullname,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Could not create user while registering");
    };

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"));


});

const loginUser = asyncHandler(async(req,res)=>{
    // req.body -> data 
    // verify username or email 
    // find the user in db 
    // verify password if found else return user not found
    // generate access token and refresh token


    const {username,email,password} = req.body;

    if (!(username || email)){
        throw new ApiError(400,"Username or email is required");
    }
    if(!password){
        throw new ApiError(400,"Password is required");
    }

    const user = await User.findOne({
        $or: [{email},{username}]
    })

    if (!user){
        throw new ApiError(404, "User does not exist");
    }

    const PasswordValid = await user.isPasswordCorrect(password);

    if (!PasswordValid){
        throw new ApiError(401,"Password is incorrect");
    }

    const{accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const userData = await User.findById(user._id).select("-password -refreshToken");

    const options ={
        httpOnly: true,
        secure:true
    }
    
    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponse(200,userData,"User logged in successfully"));
    
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $set:{refreshToken:undefined}
    })
    
    const options ={
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"));
}

)



export { 
    registerUser
    ,loginUser,
    logoutUser
    };
    3
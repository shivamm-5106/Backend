import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



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



export { registerUser };
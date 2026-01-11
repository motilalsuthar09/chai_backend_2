import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponce.js';
import { trusted } from 'mongoose';
import { response } from 'express';
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId)=>{
  try {
    const user = await User.findById(userId)
    const refreshToken = user.generateRefreshToken()
    const AccessToken = user.generateAccessToken()

    user.refreshToken = refreshToken
    await user.save({ validationBeforeSave: false })

    return { AccessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "sonething went wrong whil generating access and refresh token ")
  }
}
const registerUser = asyncHandler(async (req, res, next) => {
  /*
    Steps:
    1. Get data from request body
    2. Validate data
    3. Check if user exists (username or email)
    4. Check for image and avatar
    5. If image then upload data from server to Cloudinary, check for successful upload
    6. Create user object - create entry in DB
    7. Submit data to MongoDB
    8. Remove password and refreshToken field from response
    9. Check for user creation
    10. Return response
  */

  const { fullname, username, email, password } = req.body;

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }

  // Handle avatar
  const avatarLocalpath = req.files?.avatar?.[0]?.path;

  // Handle cover image safely
  let coverImageLocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalpath = req.files.coverImage[0].path;
  }

  if (!avatarLocalpath) {
    throw new ApiError(400, 'Avatar file is required');
  }

  // Upload to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverImage1 = await uploadOnCloudinary(coverImageLocalpath);

  if (!avatar) {
    throw new ApiError(400, 'Avatar file is required');
  }

  // Create user
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    username: username.toLowerCase(),
    coverImage: coverImage1?.url || '',
    email,
    password
  });

  // Convert to plain object and remove sensitive fields
  const createdUser = user.toObject();
  delete createdUser.password;
  delete createdUser.refreshToken;

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registering the user');
  }

  // Return response
  return res.status(201).json(
    new ApiResponse(201, createdUser, 'User registered successfully')
  );

  /*
    Alternative validation examples:
    if (fullname === "" || username === "" || email.trim() === "" || password.trim() === "") {
      throw new ApiError(400, "All fields are required");
    }

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }
  */

});

const loginUser = asyncHandler(async (req, res) => {
  // email and password from frontend or postman
  //email or username
  //find the user
  // validation password mathces or not or email exits or not
  //genrate access and refresh token
  //send cookie
  //send reponse

  // extra
  // check the referesh token if same then direct login else logins
  // if matches then login else give error 

  const { email, username, password } = req.body

  if (!username && !email) {
    throw new ApiError(400, "username or password required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }] 
  })

  if (!user) {
    throw new ApiError(400, "user does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)


  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user cardentials")
  }

  const { AccessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // type:1
  // const loggedInUser = await user.findById(user._id).select("-password -refreshToken")

  // tpye-2
  const loggedInUser = user.toObject()
  delete user.password
  delete user.refreshToken

  const options = {
    httpOnly: true,
    secure: trusted
    // by wrting these two frontend can not medifiy cookie only server can modify cookie ... by default frontend can modify 
  }

  return res
    .status(200)
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
        {
          user: loggedInUser, AccessToken, refreshToken
        },
        "User logged in successfully")
    )
})


const LogoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options={
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .clearCookie("accesssToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(response, {}, "User Logged Out"))
})

const refreshAccessToken= asyncHandler(async (req,res)=>{
 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

 if (!incomingRefreshToken) {
  throw new ApiError(401,"Unathorized Request");
 }

 try {
  const decodedToken=jwt.verify(incomingRefreshToken,process.env.RTS)
 
  const user =User.findById(decodedToken?._id)
 
  if (!user) {
   throw new ApiError(401,"Invalid Refresh Token");
  }
 
  if(incomingRefreshToken !== user?.refreshToken){
   throw new ApiError(401,"Refresh token is expired or used")
  }
 
  const options={
   httpOnly:true,
   secure: true
  }
 
  const {AccessToken,newRefreshToken} =await generateAccessAndRefreshTokens(user._id)
 
 
  return res
  .status(200)
  .cookie("accessToken", AccessToken ,options)
  .cookie("refreshToken", newRefreshToken,options)
  .json(
   new ApiResponse(200,
     {AccessToken ,newRefreshToken },
     "AccessToken Refreshed Successfully"
   )
  )
 } catch (error) {
  throw new ApiError(401,error?.message || "Invalid Refresh Token")
 }
})

export { registerUser, loginUser ,LogoutUser ,refreshAccessToken};
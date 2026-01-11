import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from '../models/user.model.js'

const variftJWT = asyncHandler(async(req,res,next)=>{
  try {
     const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
     if (!token) {
      throw new ApiError(401,"unauthorized error") 
     }
      //decode info
      const decodedToken=jwt.verify(token,process.env.ATS)
  
      // const user= await User.findById(decodedToken?._id).select("-password -refreshToken ")
       
      const userDoc = await User.findById(decodedToken?._id);
      const user= userDoc.toObject()
      delete user.password
      delete user.refreshToken
  
      if(!user){
           throw new ApiError(401,"invalid access token")
            
      }
  
      req.user=user;
      next()

  } catch (error) {
     throw new ApiError(401,error?.message || "invalid access token") 
  }
   
})

export default variftJWT 
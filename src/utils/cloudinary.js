import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'

// in file system delete= unlink 

cloudinary.config({
    cloud_name: process.env.CCN,
    api_key: process.env.CAK,
    api_secret: process.env.CAS
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log('file is uplaoded on cloudinary', response.url);
        fs.unlinkSync(localFilePath) // remove the locally saved temprary file as the upload opration got failed
        // console.log("cloudinary response:=",response);
        
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temprary file as the upload opration got failed
        return null;
    }
}

//  cloudinary.v2.uploader.upload("",{public_id:""}, function(error,result){console.log(result);
//  })

export { uploadOnCloudinary }
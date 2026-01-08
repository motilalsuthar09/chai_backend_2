// const asyncHandler=(fn)=>{
//    return (req,res,next)=>{
//         Promise.resolve().catch((err)=> next(err))
//     }
// }


// understanding
// const asyncHandler =()=>{}
// const asyncHandler =(fn)=>{()=>{}}
// const asyncHandler =(fn)=>()=>{}
// const asyncHandler =(fn)=> async()=>{}

// try-catch method:-
const asyncHandler = (fn) =>  async (req, res, next) => {
    try {
        return await fn(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message || "internal server error"
        });
    }
}

export { asyncHandler }

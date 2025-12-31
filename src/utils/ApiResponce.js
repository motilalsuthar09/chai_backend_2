class ApiResponse{
    constructor(StatusCode,data,message="success"){
        this.StatusCode=StatusCode
        this.data=data
        this.message=message
        this.success-StatusCode < 400
    }
}

export {ApiResponse}

// informational res 100-199
// successfull res 200-299
// redirection mes 300-399
// client error res 400-499
// server error res 500-599
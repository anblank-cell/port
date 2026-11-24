using System.Collections.Generic;

namespace Backend.Models
{
    /// <summary>
    /// Represents a standardized API response structure for all REST API endpoints.
    /// </summary>
    /// <typeparam name="T">The type of the response data.</typeparam>
    public class ApiResponse<T>
    {
        /// <summary>
        /// Gets or sets a value indicating whether the request was processed successfully.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Gets or sets a descriptive message explaining the outcome of the request.
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// Gets or sets the main response payload.
        /// </summary>
        public T? Data { get; set; }

        /// <summary>
        /// Gets or sets the list of validation or execution errors, if any.
        /// </summary>
        public List<string>? Errors { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ApiResponse{T}"/> class.
        /// </summary>
        public ApiResponse()
        {
            Message = string.Empty;
        }

        /// <summary>
        /// Creates a successful API response with data.
        /// </summary>
        /// <param name="data">The response data.</param>
        /// <param name="message">An optional success message.</param>
        /// <returns>A structured <see cref="ApiResponse{T}"/> object indicating success.</returns>
        public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                Errors = null
            };
        }

        /// <summary>
        /// Creates a failed API response with a collection of error details.
        /// </summary>
        /// <param name="errors">A list of error messages.</param>
        /// <param name="message">An optional error status summary message.</param>
        /// <returns>A structured <see cref="ApiResponse{T}"/> object indicating failure.</returns>
        public static ApiResponse<T> FailureResponse(List<string> errors, string message = "Failure")
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default,
                Errors = errors
            };
        }

        /// <summary>
        /// Creates a failed API response with a single error message.
        /// </summary>
        /// <param name="error">A single error message.</param>
        /// <param name="message">An optional error status summary message.</param>
        /// <returns>A structured <see cref="ApiResponse{T}"/> object indicating failure.</returns>
        public static ApiResponse<T> FailureResponse(string error, string message = "Failure")
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default,
                Errors = new List<string> { error }
            };
        }
    }
}

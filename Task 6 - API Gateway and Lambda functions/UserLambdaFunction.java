package lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

/**
 * Lambda function for user authentication and registration.
 * Handles login and registration requests through API Gateway.
 */
public class UserLambdaFunction implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final AmazonDynamoDB client;
    private final DynamoDB dynamoDB;
    private final Table loginTable;
    private final ObjectMapper objectMapper;
    private final String loginTableName = "login";

    /**
     * Constructor initializes DynamoDB client and table references.
     */
    public UserLambdaFunction() {
        this.client = AmazonDynamoDBClientBuilder.standard().build();
        this.dynamoDB = new DynamoDB(client);
        this.loginTable = dynamoDB.getTable(loginTableName);
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Received request: path=" + request.getPath() + ", method=" + request.getHttpMethod());

        try {
            // Determine HTTP method
            String httpMethod = request.getHttpMethod();
            String path = request.getPath();

            if ("OPTIONS".equals(httpMethod)) {
                // Handle OPTIONS requests (for CORS preflight)
                return createCorsResponse();
            } else if ("POST".equals(httpMethod)) {
                // Handle POST requests based on path
                if (path.contains("/login")) {
                    return handleLogin(request, context);
                } else if (path.contains("/register")) {
                    return handleRegister(request, context);
                } else {
                    return createErrorResponse("Unsupported path: " + path);
                }
            } else {
                return createErrorResponse("Unsupported HTTP method: " + httpMethod);
            }
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            e.printStackTrace();
            return createErrorResponse("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Handles user login authentication.
     *
     * @param request API Gateway request
     * @param context Lambda context
     * @return API Gateway response with authentication result
     */
    private APIGatewayProxyResponseEvent handleLogin(APIGatewayProxyRequestEvent request, Context context) {
        try {
            String body = request.getBody();
            context.getLogger().log("Login request body received");

            if (body == null || body.isEmpty()) {
                return createErrorResponse("No request body provided");
            }

            Map<String, Object> requestMap = objectMapper.readValue(body, Map.class);

            String email = (String) requestMap.get("email");
            String password = (String) requestMap.get("password");

            if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
                return createErrorResponse("Email and password are required");
            }

            // Get user from DynamoDB
            Item userItem = loginTable.getItem("email", email);

            if (userItem == null) {
                return createErrorResponse("Email or password is invalid");
            }

            String storedPassword = userItem.getString("password");

            if (!storedPassword.equals(password)) {
                return createErrorResponse("Email or password is invalid");
            }

            // Login successful
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", true);

            // Include user information in response
            Map<String, String> userData = new HashMap<>();
            userData.put("email", email);
            userData.put("user_name", userItem.getString("user_name"));
            responseBody.put("user", userData);

            return createResponse(200, objectMapper.writeValueAsString(responseBody));

        } catch (Exception e) {
            context.getLogger().log("Login error: " + e.getMessage());
            return createErrorResponse("Error during login: " + e.getMessage());
        }
    }

    /**
     * Handles user registration.
     *
     * @param request API Gateway request
     * @param context Lambda context
     * @return API Gateway response with registration result
     */
    private APIGatewayProxyResponseEvent handleRegister(APIGatewayProxyRequestEvent request, Context context) {
        try {
            String body = request.getBody();
            context.getLogger().log("Registration request body received");

            if (body == null || body.isEmpty()) {
                return createErrorResponse("No request body provided");
            }

            Map<String, Object> requestMap = objectMapper.readValue(body, Map.class);

            String email = (String) requestMap.get("email");
            String userName = (String) requestMap.get("user_name");
            String password = (String) requestMap.get("password");

            if (email == null || email.isEmpty() ||
                    userName == null || userName.isEmpty() ||
                    password == null || password.isEmpty()) {
                return createErrorResponse("Email, username, and password are required");
            }

            // Check if email already exists
            Item existingUser = loginTable.getItem("email", email);

            if (existingUser != null) {
                return createErrorResponse("The email already exists");
            }

            // Create new user
            Item newUser = new Item()
                    .withPrimaryKey("email", email)
                    .withString("user_name", userName)
                    .withString("password", password);

            loginTable.putItem(newUser);

            // Create success response
            return createSuccessResponse("Registration successful");

        } catch (Exception e) {
            context.getLogger().log("Registration error: " + e.getMessage());
            return createErrorResponse("Error during registration: " + e.getMessage());
        }
    }

    /**
     * Creates a response with CORS headers.
     *
     * @param statusCode HTTP status code
     * @param body Response body as JSON string
     * @return API Gateway response
     */
    private APIGatewayProxyResponseEvent createResponse(int statusCode, String body) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "OPTIONS,GET,POST");
        headers.put("Access-Control-Allow-Headers", "Content-Type");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(statusCode);
        response.setHeaders(headers);
        response.setBody(body);

        return response;
    }

    /**
     * Creates a success response.
     *
     * @param message Success message
     * @return API Gateway response with success status
     */
    private APIGatewayProxyResponseEvent createSuccessResponse(String message) {
        try {
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", true);
            responseBody.put("message", message);

            return createResponse(200, objectMapper.writeValueAsString(responseBody));
        } catch (Exception e) {
            // Fallback if JSON serialization fails
            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(200);
            response.setBody("{\"success\":true,\"message\":\"" + message.replace("\"", "\\\"") + "\"}");
            return response;
        }
    }

    /**
     * Creates an error response.
     *
     * @param message Error message
     * @return API Gateway response with error status
     */
    private APIGatewayProxyResponseEvent createErrorResponse(String message) {
        try {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", message);

            return createResponse(200, objectMapper.writeValueAsString(errorResponse));
        } catch (Exception e) {
            // Fallback if JSON serialization fails
            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(200);
            response.setBody("{\"success\":false,\"message\":\"" + message.replace("\"", "\\\"") + "\"}");
            return response;
        }
    }

    /**
     * Creates a response for CORS preflight requests.
     *
     * @return API Gateway response with CORS headers
     */
    private APIGatewayProxyResponseEvent createCorsResponse() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "OPTIONS,GET,POST");
        headers.put("Access-Control-Allow-Headers", "Content-Type");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(200);
        response.setHeaders(headers);
        response.setBody("");

        return response;
    }
}

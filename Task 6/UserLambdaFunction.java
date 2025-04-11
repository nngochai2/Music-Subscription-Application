package lambda;

import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.*;
import com.amazonaws.services.dynamodbv2.document.spec.GetItemSpec;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

public class UserLambdaFunction implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final Table loginTable;
    private final ObjectMapper objectMapper;

    public UserLambdaFunction() {
        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()
                .withCredentials(DefaultAWSCredentialsProviderChain.getInstance())
                .build();
        DynamoDB dynamoDB = new DynamoDB(client);
        loginTable = dynamoDB.getTable("login");
        objectMapper = new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Received request: " + request);

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application.json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "OPTIONS,GET,POST");
        headers.put("Access-Control-Allow-Headers", "Content-Type");
        response.setHeaders(headers);

        // Handle preflight options request
        if ("OPTIONS".equals(request.getHttpMethod())) {
            response.setStatusCode(200);
            return response;
        }

        try {
            // Get the path and HTTP method
            String path = request.getPath();
            String httpMethod = request.getHttpMethod();

            if (path.endsWith("/login") && "POST".equals(httpMethod)) {
                return this.handleUserLogin(request, response, context);
            } else if (path.endsWith("/register") && "POST".equals(httpMethod)) {
                return this.handleUserRegistration(request, response, context);
            }

            // If path is not recognized
            response.setStatusCode(404);
            response.setBody("{\"success\":false,\"message\":\"Route not found\"}");
            return response;
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"success\":false,\"message\":\"Internal server error: " + e.getMessage() + "\"}");
            return response;
        }
    }

    public APIGatewayProxyResponseEvent handleUserLogin(APIGatewayProxyRequestEvent request,
                                                        APIGatewayProxyResponseEvent response,
                                                        Context context) {
        try {
            // Parse request body
            String requestBody = request.getBody();
            JsonNode rootNode = objectMapper.readTree(requestBody);

            // Extract user details
            String email = rootNode.path("email").asText();
            String password = rootNode.path("password").asText();

            GetItemSpec spec = new GetItemSpec().withPrimaryKey("email", email);
            Item userItem = loginTable.getItem(spec);

            if (userItem == null) {
                response.setStatusCode(401);
                response.setBody("{\"success\":false,\"message\":\"Invalid email or password\"}");
                return response;
            }

            String storedPassword = userItem.getString("password");
            if (!storedPassword.equals(password)) {
                response.setStatusCode(401);
                response.setBody("{\"success\":false,\"message\":\"Invalid password\"}");
                return response;
            }

            response.setStatusCode(200);
            response.setBody("{\"success\":true,\"message\":\"Login successful\"}");
            return response;
        } catch (Exception e) {
            context.getLogger().log("Login error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"success\":false,\"message\":\"Login failed: " + e.getMessage() + "\"}");
            return response;
        }
    }

    private APIGatewayProxyResponseEvent handleUserRegistration(APIGatewayProxyRequestEvent request,
                                                               APIGatewayProxyResponseEvent response,
                                                               Context context) {
        try {
            // Parse request body
            String requestBody = request.getBody();
            JsonNode rootNode = objectMapper.readTree(requestBody);

            // Extract user details
            String email = rootNode.path("email").asText();
            String userName = rootNode.path("user_name").asText();
            String password = rootNode.path("password").asText();

            // Validate user input
            if (email.isEmpty() || userName.isEmpty() || password.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"success\":false,\"message\":\"All fields are required\"}");
                return response;
            }

            // Check if the user already exists
            GetItemSpec spec = new GetItemSpec()
                    .withPrimaryKey("email", email);

            Item userItem = loginTable.getItem(spec);

            if (userItem != null) {
                response.setStatusCode(400);
                response.setBody("{\"success\":false,\"message\":\"Email already registered\"}");
                return response;
            }

            // Create new user
            Item newUser = new Item()
                    .withPrimaryKey("email", email)
                    .withString("user_name", userName)
                    .withString("password", password);

            loginTable.putItem(newUser);

            response.setStatusCode(200);
            response.setBody("{\"success\":true,\"message\":\"User registered successfully\"}");
            return response;
        } catch (Exception e) {
            context.getLogger().log("Registration error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"success\":false,\"message\":\"Registration failed: " + e.getMessage() + "\"}");
            return response;
        }
    }

}

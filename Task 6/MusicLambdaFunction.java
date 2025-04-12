package lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.ItemCollection;
import com.amazonaws.services.dynamodbv2.document.QueryOutcome;
import com.amazonaws.services.dynamodbv2.document.ScanOutcome;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.document.spec.QuerySpec;
import com.amazonaws.services.dynamodbv2.document.spec.ScanSpec;
import com.amazonaws.services.dynamodbv2.document.utils.ValueMap;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class MusicLambdaFunction implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    /**
     * Music Lambda Function for handling music queries and subscription management.
     * Code adapted from multiple sources:
     * - AWS Lambda Java Events documentation: <a href="https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html">...</a>
     * - AWS API Gateway Lambda Proxy integration: <a href="https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html">...</a>
     * - AWS DynamoDB document API examples: <a href="https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/JavaDocumentAPIWorkingWithItems.html">...</a>
     * - Lambda function code debug and refinement provided by Claude AI assistant, April 2025
     */

    private final AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard().build();
    private final DynamoDB dynamoDB = new DynamoDB(client);
    private final String musicTableName = "music";
    private final String subscriptionsTableName = "subscriptions";
    private final String loginTableName = "login";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Received request: " + request);

        try {
            // Determine HTTP method
            String httpMethod = request.getHttpMethod();
            String path = request.getPath();
            context.getLogger().log("HTTP Method: " + httpMethod + ", Path: " + path);

            if ("GET".equals(httpMethod)) {
                // Handle GET requests (query parameters)
                return handleGetRequest(request, context);
            } else if ("POST".equals(httpMethod)) {
                // Handle POST requests (request body)
                return handlePostRequest(request, context);
            } else if ("DELETE".equals(httpMethod)) {
                // Handle DELETE requests (request body)
                return handleDeleteRequest(request, context);
            } else if ("OPTIONS".equals(httpMethod)) {
                // Handle OPTIONS requests (for CORS preflight)
                return createCorsResponse();
            } else {
                return createErrorResponse("Unsupported HTTP method: " + httpMethod);
            }
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            e.printStackTrace();
            return createErrorResponse("Internal server error: " + e.getMessage());
        }
    }

    private APIGatewayProxyResponseEvent handleGetRequest(APIGatewayProxyRequestEvent request, Context context) {
        // Get query parameters for GET requests
        Map<String, String> queryParams = request.getQueryStringParameters();
        context.getLogger().log("Query parameters: " + queryParams);

        if (queryParams == null || queryParams.isEmpty()) {
            return createErrorResponse("No query parameters provided");
        }

        String path = request.getPath();

        if (path.contains("/music/query")) {
            // Handle music query
            return handleMusicQuery(queryParams, context);
        } else if (path.contains("/subscriptions")) {
            // Handle GET subscriptions
            return handleGetSubscriptions(queryParams, context);
        } else if (path.contains("/login")) {
            // Handle login authentication
            return handleLogin(queryParams, context);
        } else {
            return createErrorResponse("Unsupported path: " + path);
        }
    }

    private APIGatewayProxyResponseEvent handlePostRequest(APIGatewayProxyRequestEvent request, Context context) {
        // Get request body for POST requests
        String body = request.getBody();
        context.getLogger().log("Request body: " + body);

        if (body == null || body.isEmpty()) {
            return createErrorResponse("No request body provided");
        }

        String path = request.getPath();

        if (path.contains("/subscriptions")) {
            // Handle POST subscriptions (add subscription)
            return handleAddSubscription(body, context);
        } else if (path.contains("/register")) {
            // Handle user registration
            return handleRegister(body, context);
        } else {
            return createErrorResponse("Unsupported path: " + path);
        }
    }

    private APIGatewayProxyResponseEvent handleDeleteRequest(APIGatewayProxyRequestEvent request, Context context) {
        // Get request body for DELETE requests
        String body = request.getBody();
        context.getLogger().log("Request body: " + body);

        if (body == null || body.isEmpty()) {
            return createErrorResponse("No request body provided");
        }

        String path = request.getPath();

        if (path.contains("/subscriptions")) {
            // Handle DELETE subscriptions (remove subscription)
            return handleRemoveSubscription(body, context);
        } else {
            return createErrorResponse("Unsupported path: " + path);
        }
    }

    // MUSIC QUERY HANDLER
    private APIGatewayProxyResponseEvent handleMusicQuery(Map<String, String> queryParams, Context context) {
        try {
            // Building filter expression
            StringBuilder filterExpression = new StringBuilder();
            ValueMap valueMap = new ValueMap();
            Map<String, String> nameMap = new HashMap<>();

            boolean firstCondition = true;

            if (queryParams.containsKey("title")) {
                filterExpression.append("contains(#title, :title)");
                valueMap.put(":title", queryParams.get("title"));
                nameMap.put("#title", "title");
                firstCondition = false;
            }

            if (queryParams.containsKey("artist")) {
                if (!firstCondition) {
                    filterExpression.append(" AND ");
                }
                filterExpression.append("contains(#artist, :artist)");
                valueMap.put(":artist", queryParams.get("artist"));
                nameMap.put("#artist", "artist");
                firstCondition = false;
            }

            if (queryParams.containsKey("year")) {
                if (!firstCondition) {
                    filterExpression.append(" AND ");
                }
                // Use equality instead of contains for numbers
                filterExpression.append("#year = :year");
                // Convert string parameter to number for comparison
                valueMap.put(":year", Integer.parseInt(queryParams.get("year")));
                nameMap.put("#year", "year");
                firstCondition = false;
            }

            if (queryParams.containsKey("album")) {
                if (!firstCondition) {
                    filterExpression.append(" AND ");
                }
                filterExpression.append("contains(#album, :album)");
                valueMap.put(":album", queryParams.get("album"));
                nameMap.put("#album", "album");
            }

            // Create scan spec
            ScanSpec scanSpec = new ScanSpec();

            if (filterExpression.length() > 0) {
                scanSpec.withFilterExpression(filterExpression.toString())
                        .withValueMap(valueMap)
                        .withNameMap(nameMap);
            }

            context.getLogger().log("Scan spec: " + scanSpec);

            Table table = dynamoDB.getTable(musicTableName);
            context.getLogger().log("Table obtained: " + table.getTableName());

            ItemCollection<ScanOutcome> items = table.scan(scanSpec);
            Iterator<Item> iterator = items.iterator();

            List<Map<String, Object>> musicList = new ArrayList<>();
            while (iterator.hasNext()) {
                Item item = iterator.next();
                Map<String, Object> musicMap = new HashMap<>();
                musicMap.put("title", item.getString("title"));
                musicMap.put("artist", item.getString("artist"));
                musicMap.put("year", item.getString("year"));
                musicMap.put("album", item.getString("album"));
                musicMap.put("image_url", item.getString("image_url"));
                musicList.add(musicMap);
            }

            context.getLogger().log("Found " + musicList.size() + " items");

            if (musicList.isEmpty()) {
                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("success", false);
                responseBody.put("message", "No result is retrieved. Please query again");

                return createResponse(200, objectMapper.writeValueAsString(responseBody));
            } else {
                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("success", true);
                responseBody.put("music", musicList);

                return createResponse(200, objectMapper.writeValueAsString(responseBody));
            }

        } catch (Exception e) {
            context.getLogger().log("Error querying music: " + e.getMessage());
            return createErrorResponse("Error querying music: " + e.getMessage());
        }
    }

    // SUBSCRIPTION HANDLERS
    private APIGatewayProxyResponseEvent handleGetSubscriptions(Map<String, String> queryParams, Context context) {
        try {
            String email = queryParams.get("email");
            if (email == null || email.isEmpty()) {
                return createErrorResponse("Email parameter is required");
            }

            // Query DynamoDB for subscriptions
            Table subscriptionsTable = dynamoDB.getTable(subscriptionsTableName);

            // Build query to get subscriptions for this email
            QuerySpec querySpec = new QuerySpec()
                    .withKeyConditionExpression("email = :email")
                    .withValueMap(new ValueMap()
                            .withString(":email", email));

            ItemCollection<QueryOutcome> items = subscriptionsTable.query(querySpec);
            Iterator<Item> iterator = items.iterator();

            List<Map<String, Object>> subscriptionsList = new ArrayList<>();
            while (iterator.hasNext()) {
                Item item = iterator.next();
                Map<String, Object> subscription = new HashMap<>();
                subscription.put("title", item.getString("title"));
                subscription.put("artist", item.getString("artist"));
                subscription.put("year", item.getString("year"));
                subscription.put("album", item.getString("album"));
                subscription.put("image_url", item.getString("image_url"));
                subscription.put("music_id", item.getString("music_id"));
                subscription.put("s3_image_url", item.getString("s3_image_url"));
                subscriptionsList.add(subscription);
            }

            // Create response
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", true);
            responseBody.put("subscriptions", subscriptionsList);

            return createResponse(200, objectMapper.writeValueAsString(responseBody));
        } catch (Exception e) {
            context.getLogger().log("Error getting subscriptions: " + e.getMessage());
            return createErrorResponse("Error getting subscriptions: " + e.getMessage());
        }
    }

    private APIGatewayProxyResponseEvent handleAddSubscription(String requestBody, Context context) {
        try {
            // Parse request body
            Map<String, Object> requestMap = objectMapper.readValue(requestBody, Map.class);

            String email = (String) requestMap.get("email");
            String title = (String) requestMap.get("title");
            String artist = (String) requestMap.get("artist");
            String year = String.valueOf(requestMap.get("year")); // Convert to string in case it's a number
            String album = (String) requestMap.get("album");
            String imageUrl = (String) requestMap.get("image_url");

            if (email == null || title == null || artist == null || album == null) {
                return createErrorResponse("Required fields missing");
            }

            // Create a unique music_id (title#album is common)
            String musicId = title + "#" + album;

            // Create a new subscription item
            Table subscriptionsTable = dynamoDB.getTable(subscriptionsTableName);

            // Check if already subscribed
            QuerySpec querySpec = new QuerySpec()
                    .withKeyConditionExpression("email = :email AND music_id = :music_id")
                    .withValueMap(new ValueMap()
                            .withString(":email", email)
                            .withString(":music_id", musicId));

            ItemCollection<QueryOutcome> existing = subscriptionsTable.query(querySpec);
            if (existing.iterator().hasNext()) {
                return createSuccessResponse("Already subscribed to this music");
            }

            // Add new subscription
            Item item = new Item()
                    .withPrimaryKey("email", email, "music_id", musicId)
                    .withString("title", title)
                    .withString("artist", artist)
                    .withString("year", year != null ? year : "")
                    .withString("album", album)
                    .withString("image_url", imageUrl != null ? imageUrl : "")
                    .withString("s3_image_url", imageUrl != null ? imageUrl : ""); // In a real app, this would be an S3 URL

            subscriptionsTable.putItem(item);

            // Create success response
            return createSuccessResponse("Music subscription successful");
        } catch (Exception e) {
            context.getLogger().log("Error adding subscription: " + e.getMessage());
            return createErrorResponse("Error adding subscription: " + e.getMessage());
        }
    }

    private APIGatewayProxyResponseEvent handleRemoveSubscription(String requestBody, Context context) {
        try {
            // Parse request body
            Map<String, Object> requestMap = objectMapper.readValue(requestBody, Map.class);

            String email = (String) requestMap.get("email");
            String musicId = (String) requestMap.get("music_id");

            if (email == null || musicId == null) {
                return createErrorResponse("Email and music_id are required");
            }

            // Remove the subscription
            Table subscriptionsTable = dynamoDB.getTable(subscriptionsTableName);
            subscriptionsTable.deleteItem("email", email, "music_id", musicId);

            // Create success response
            return createSuccessResponse("Subscription removed successfully");
        } catch (Exception e) {
            context.getLogger().log("Error removing subscription: " + e.getMessage());
            return createErrorResponse("Error removing subscription: " + e.getMessage());
        }
    }

    // AUTHENTICATION HANDLERS
    private APIGatewayProxyResponseEvent handleLogin(Map<String, String> queryParams, Context context) {
        try {
            String email = queryParams.get("email");
            String password = queryParams.get("password");

            if (email == null || password == null) {
                return createErrorResponse("Email and password are required");
            }

            // Query the login table
            Table loginTable = dynamoDB.getTable(loginTableName);
            Item item = loginTable.getItem("email", email);

            if (item == null) {
                return createErrorResponse("Email or password is invalid");
            }

            String storedPassword = item.getString("password");

            if (password.equals(storedPassword)) {
                // Login successful
                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("success", true);
                responseBody.put("user", new HashMap<String, String>() {{
                    put("email", email);
                    put("user_name", item.getString("user_name"));
                }});

                return createResponse(200, objectMapper.writeValueAsString(responseBody));
            } else {
                return createErrorResponse("Email or password is invalid");
            }
        } catch (Exception e) {
            context.getLogger().log("Error during login: " + e.getMessage());
            return createErrorResponse("Error during login: " + e.getMessage());
        }
    }

    private APIGatewayProxyResponseEvent handleRegister(String requestBody, Context context) {
        try {
            // Parse request body
            Map<String, Object> requestMap = objectMapper.readValue(requestBody, Map.class);

            String email = (String) requestMap.get("email");
            String userName = (String) requestMap.get("user_name");
            String password = (String) requestMap.get("password");

            if (email == null || userName == null || password == null) {
                return createErrorResponse("Email, username, and password are required");
            }

            // Check if email already exists
            Table loginTable = dynamoDB.getTable(loginTableName);
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
            context.getLogger().log("Error during registration: " + e.getMessage());
            return createErrorResponse("Error during registration: " + e.getMessage());
        }
    }

    // HELPER METHODS
    private APIGatewayProxyResponseEvent createResponse(int statusCode, String body) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "OPTIONS,GET,POST,DELETE");
        headers.put("Access-Control-Allow-Headers", "Content-Type");
        headers.put("Content-Type", "application/json");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(statusCode);
        response.setHeaders(headers);
        response.setBody(body);

        return response;
    }

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

    // Update the fallback in createErrorResponse to include CORS headers
    private APIGatewayProxyResponseEvent createErrorResponse(String message) {
        try {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", message);

            return createResponse(200, objectMapper.writeValueAsString(errorResponse));
        } catch (Exception e) {
            // Add CORS headers in fallback
            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(200);

            Map<String, String> headers = new HashMap<>();
            headers.put("Access-Control-Allow-Origin", "*");
            headers.put("Access-Control-Allow-Methods", "OPTIONS,GET,POST,DELETE");
            headers.put("Access-Control-Allow-Headers", "Content-Type");
            headers.put("Content-Type", "application/json");
            response.setHeaders(headers);

            response.setBody("{\"success\":false,\"message\":\"" + message.replace("\"", "\\\"") + "\"}");
            return response;
        }
    }

    private APIGatewayProxyResponseEvent createCorsResponse() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "OPTIONS,GET,POST,DELETE");
        headers.put("Access-Control-Allow-Headers", "Content-Type");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(200);
        response.setHeaders(headers);
        response.setBody("");

        return response;
    }
}

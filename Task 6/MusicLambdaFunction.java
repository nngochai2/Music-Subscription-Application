package lambda;

import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.*;
import com.amazonaws.services.dynamodbv2.document.spec.DeleteItemSpec;
import com.amazonaws.services.dynamodbv2.document.spec.GetItemSpec;
import com.amazonaws.services.dynamodbv2.document.spec.QuerySpec;
import com.amazonaws.services.dynamodbv2.document.spec.ScanSpec;
import com.amazonaws.services.dynamodbv2.document.utils.ValueMap;
import com.amazonaws.services.dynamodbv2.model.*;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MusicLambdaFunction implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    /**
     * Music Lambda Function for handling music queries and subscription management.
     * Code adapted from multiple sources:
     * - AWS Lambda Java Events documentation: <a href="https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html">...</a>
     * - AWS API Gateway Lambda Proxy integration: <a href="https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html">...</a>
     * - AWS DynamoDB document API examples: <a href="https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/JavaDocumentAPIWorkingWithItems.html">...</a>
     */
    private final AmazonDynamoDB client;
    private final DynamoDB dynamoDB;
    private final Table musicTable;
    private Table subscriptionsTable;
    private final ObjectMapper objectMapper;

    public MusicLambdaFunction() {
        client = AmazonDynamoDBClientBuilder.standard()
                .withCredentials(DefaultAWSCredentialsProviderChain.getInstance())
                .build();
        dynamoDB = new DynamoDB(client);
        musicTable = dynamoDB.getTable("music");

        // Check if the subscriptions table exist
        try {
            subscriptionsTable = dynamoDB.getTable("subscriptions");

            // Check if the table exists by trying to describe it
            subscriptionsTable.describe();
        } catch (Exception e) {
            // If table doesn't exist, create one
            this.createSubscriptionsTable();
        }

        objectMapper = new ObjectMapper();
    }

    /**
     * Helper function to create the "subscriptions" table if it has not been created
     */
    private void createSubscriptionsTable() {
        try {
            List<KeySchemaElement> keySchema = new ArrayList<>();
            keySchema.add(new KeySchemaElement()
                    .withAttributeName("email")
                    .withKeyType(KeyType.HASH)); // Partition key
            keySchema.add(new KeySchemaElement()
                    .withAttributeName("music_id")
                    .withKeyType(KeyType.RANGE)); // Sort key

            List<AttributeDefinition> attributeDefinitions = new ArrayList<>();
            attributeDefinitions.add(new AttributeDefinition()
                    .withAttributeName("email")
                    .withAttributeType(ScalarAttributeType.S));
            attributeDefinitions.add(new AttributeDefinition()
                    .withAttributeName("music_id")
                    .withAttributeType(ScalarAttributeType.S));

            CreateTableRequest request = new CreateTableRequest()
                    .withTableName("subscriptions")
                    .withKeySchema(keySchema)
                    .withAttributeDefinitions(attributeDefinitions)
                    .withProvisionedThroughput(
                            new ProvisionedThroughput().withReadCapacityUnits(5L).withWriteCapacityUnits(5L)
                    );

            client.createTable(request);

            // Wait for table to be created
            Table newTable = dynamoDB.getTable("subscriptions");
            newTable.waitForActive();
        } catch (Exception e) {
            System.err.println("Error creating subscriptions table: " + e.getMessage());
        }
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Received request: " + request);

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application.json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "OPTIONS,GET,POST,DELETE");
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

            // Handle music query requests
            if (path.endsWith("/music/query") && "GET".equals(httpMethod)) {
                return this.handleMusicQuery(request, response, context);
            } else if (path.endsWith("/subscriptions")) {
                // Handle subscription requests
                if ("GET".equals(httpMethod)) {
                    return this.handleGetSubscriptions(request, response, context);
                } else if ("POST".equals(httpMethod)) {
                    return this.handleAddSubscription(request, response, context);
                } else if ("DELETE".equals(httpMethod)) {
                    return this.handleRemoveSubscription(request, response, context);
                }
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

    /**
     * Handle music query request
     */
    private APIGatewayProxyResponseEvent handleMusicQuery(APIGatewayProxyRequestEvent request,
                                                          APIGatewayProxyResponseEvent response,
                                                          Context context) {
        try {
            // Get query params
            Map<String, String> queryParams = request.getQueryStringParameters();
            if (queryParams == null) {
                queryParams = new HashMap<>();
            }

            String title = queryParams.getOrDefault("title", "");
            String artist = queryParams.getOrDefault("artist", "");
            String year = queryParams.getOrDefault("year", "");
            String album = queryParams.getOrDefault("album", "");

            // Check if at least one query parameter is provided
            if (title.isEmpty() && artist.isEmpty() && year.isEmpty() && album.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"success\":false,\"message\":\"At least one search criteria is required\"}");
                return response;
            }

            List<Item> results = new ArrayList<>();

            // Execute the query approach based on provided params
            if (!artist.isEmpty() && title.isEmpty() && album.isEmpty() && year.isEmpty()) {
                // Query by artist using scan
                ScanSpec scanSpec = new ScanSpec()
                        .withFilterExpression("contains(artist, :artist)")
                        .withValueMap(new ValueMap().withString(":artist", artist));

                ItemCollection<ScanOutcome> items = musicTable.scan(scanSpec);
                items.forEach(results::add);
            } else if (!title.isEmpty() && artist.isEmpty() && year.isEmpty()) {
                // Query by primary key
                if (!album.isEmpty()) {
                    // Query by specific title and album
                    GetItemSpec getItemSpec = new GetItemSpec()
                            .withPrimaryKey("title", title, "album", album);

                    Item item = musicTable.getItem(getItemSpec);
                    if (item != null) {
                        results.add(item);
                    }
                } else {
                    // Query for all items with the title
                    QuerySpec querySpec = new QuerySpec()
                            .withKeyConditionExpression("title = :title")
                            .withValueMap(new ValueMap().withString(":title", title));

                    ItemCollection<QueryOutcome> items = musicTable.query(querySpec);
                    items.forEach(results::add);
                }
            } else {
                // For other combinations, use scan with filter
                StringBuilder filterExpression = new StringBuilder();
                ValueMap valueMap = new ValueMap();

                if (!title.isEmpty()) {
                    filterExpression.append("contains(title, :title)");
                    valueMap.withString(":title", title);
                }

                if (!artist.isEmpty()) {
                    if (filterExpression.length() == 0) {
                        filterExpression.append(" AND ");
                    }
                    filterExpression.append("contains(artist, :artist)");
                    valueMap.withString(":artist", artist);
                }

                if (!album.isEmpty()) {
                    if (filterExpression.length() == 0) {
                        filterExpression.append(" AND ");
                    }
                    filterExpression.append("contains(album, :album)");
                    valueMap.withString(":album", album);
                }

                ScanSpec scanSpec = new ScanSpec()
                        .withFilterExpression(filterExpression.toString())
                        .withValueMap(valueMap);

                ItemCollection<ScanOutcome> items = musicTable.scan(scanSpec);
                items.forEach(results::add);
            }

            // If no result found
            if (results.isEmpty()) {
                response.setStatusCode(404);
                response.setBody("{\"success\":false,\"message\":\"No result is retrieved. Please query again\"}");
                return response;
            }

            // Build response with results
            ObjectNode responseBody = objectMapper.createObjectNode();
            responseBody.put("success", true);

            ArrayNode musicArray = responseBody.putArray("music");
            for (Item item : results) {
                ObjectNode musicNode = objectMapper.createObjectNode();
                Map<String, Object> itemMap = item.asMap();

                for (Map.Entry<String, Object> entry : itemMap.entrySet()) {
                    String key = entry.getKey();
                    Object value = entry.getValue();

                    if (value instanceof String) {
                        musicNode.put(key, (String) value);
                    } else if (value instanceof Number) {
                        musicNode.put(key, ((Number) value).intValue());
                    }
                }

                // Generate music_id if it doesn't exist
                if (!itemMap.containsKey("music_id")) {
                    String musicId = item.getString("title") + "-" + item.getString("album");
                    musicNode.put("music_id", musicId);
                }

                musicArray.add(musicNode);
            }

            response.setStatusCode(200);
            response.setBody(objectMapper.writeValueAsString(responseBody));

            return response;

        } catch (Exception e) {
            context.getLogger().log("Query error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"success\":false,\"message\":\"Query failed: " + e.getMessage() + "\"}");
            return response;
        }
    }

    private APIGatewayProxyResponseEvent handleGetSubscriptions(APIGatewayProxyRequestEvent request,
                                                                APIGatewayProxyResponseEvent response,
                                                                Context context) {
        try {
            // Get email from query parameter
            Map<String, String> queryParams = request.getQueryStringParameters();
            if (queryParams == null || !queryParams.containsKey("email")) {
                response.setStatusCode(400);
                response.setBody("{\"success\":false,\"message\":\"Email is required\"}");
                return response;
            }

            String email = queryParams.get("email");

            // Query subscriptions table
            QuerySpec querySpec = new QuerySpec()
                    .withKeyConditionExpression("email = :email")
                    .withValueMap(new ValueMap().withString(":email", email));

            ItemCollection<QueryOutcome> items = subscriptionsTable.query(querySpec);

            // Build response with subscriptions
            ObjectNode responseBody = objectMapper.createObjectNode();
            responseBody.put("success", true);

            ArrayNode subscriptionsArray = responseBody.putArray("subscriptions");
            for (Item item : items) {
                ObjectNode subscriptionNode = objectMapper.createObjectNode();
                Map<String, Object> itemMap = item.asMap();

                for (Map.Entry<String, Object> entry : itemMap.entrySet()) {
                    String key = entry.getKey();
                    Object value = entry.getValue();

                    if (value instanceof String) {
                        subscriptionNode.put(key, (String) value);
                    } else if (value instanceof Number) {
                        subscriptionNode.put(key, ((Number) value).intValue());
                    }
                }

                subscriptionsArray.add(subscriptionNode);
            }

            response.setStatusCode(200);
            response.setBody(objectMapper.writeValueAsString(responseBody));
            return response;

        } catch (Exception e) {
            context.getLogger().log("Get subscriptions error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"success\":false,\"message\":\"Failed to get subscriptions: " + e.getMessage() + "\"}");
            return response;
        }
    }

    private APIGatewayProxyResponseEvent handleAddSubscription(APIGatewayProxyRequestEvent request,
                                                               APIGatewayProxyResponseEvent response,
                                                               Context context) {
        try {
            // Parse request body
            String requestBody = request.getBody();
            JsonNode rootNode = objectMapper.readTree(requestBody);

            // Extract subscription details
            String email = rootNode.path("email").asText();
            String title = rootNode.path("title").asText();
            String artist = rootNode.path("artist").asText();
            String year = rootNode.path("year").asText();
            String album = rootNode.path("album").asText();
            String imageUrl = rootNode.path("image_url").asText();

            // Validate user input
            if (email.isEmpty() || title.isEmpty() || artist.isEmpty() ||
                    year.isEmpty() || album.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"success\":false,\"message\":\"All fields are required\"}");
                return response;
            }

            // Create music_id from title and album
            String musicId = title + "-" + album;

            // Check if the music has already been subscribed
            GetItemSpec getItemSpec = new GetItemSpec()
                    .withPrimaryKey("email", email, "music_id", musicId);

            Item existingItem = subscriptionsTable.getItem(getItemSpec);

            if (existingItem == null) {
                // Create new subscription
                Item newSubscription = new Item()
                        .withPrimaryKey("email", email, "music_id", musicId)
                        .withString("title", title)
                        .withString("artist", artist)
                        .withInt("year", Integer.parseInt(year))
                        .withString("album", album)
                        .withString("image_url", imageUrl);

                // Add s3_image_url if available in the request
                if (rootNode.has("s3_image_url")) {
                    newSubscription.withString("s3_image_url", rootNode.path("s3_image_url").asText());
                }

                subscriptionsTable.putItem(newSubscription);
            }

            response.setStatusCode(200);
            response.setBody("{\"success\":true,\"message\":\"Music subscription successful\"}");
            return response;
        } catch (Exception e) {
            context.getLogger().log("Subscribe music error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"success\":false,\"message\":\"Subscribe failed: " + e.getMessage() + "\"}");
            return response;
        }
    }

    private APIGatewayProxyResponseEvent handleRemoveSubscription(APIGatewayProxyRequestEvent request,
                                                               APIGatewayProxyResponseEvent response,
                                                               Context context) {
        try {
            // Parse request body
            String requestBody = request.getBody();
            JsonNode rootNode = objectMapper.readTree(requestBody);

            // Extract details
            String email = rootNode.path("email").asText();
            String musicId = rootNode.path("music_id").asText();

            // Validate input
            if (email.isEmpty() || musicId.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"success\":false,\"message\":\"Email and music_id are required\"}");
                return response;
            }

            // Delete the subscription
            DeleteItemSpec deleteItemSpec = new DeleteItemSpec()
                    .withPrimaryKey("email", email, "music_id", musicId);

            subscriptionsTable.deleteItem(deleteItemSpec);

            response.setStatusCode(200);
            response.setBody("{\"success\":true,\"message\":\"Subscription removed successfully\"}");
            return response;
        } catch (Exception e) {
            context.getLogger().log("Remove subscription error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"success\":false,\"message\":\"Failed to remove subscription: " + e.getMessage() + "\"}");
            return response;
        }
    }
}

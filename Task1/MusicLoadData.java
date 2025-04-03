import java.io.File;
import java.util.Iterator;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/*
Code adapted from Week 4 lab code MoviesLoadData
https://rmit.instructure.com/courses/141320/files/43744112?wrap=1
 */
public class MusicLoadData {

    public static void main(String[] args) throws Exception {

        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()
                .withRegion(Regions.US_EAST_1)
                .withCredentials(new ProfileCredentialsProvider("default"))
                .build();

        DynamoDB dynamoDB = new DynamoDB(client);

        Table table = dynamoDB.getTable("music");

        // Read JSON file
        JsonParser parser = new JsonFactory().createParser(new File("2025a1.json"));
        JsonNode rootNode = new ObjectMapper().readTree(parser);

        // Navigate to "songs" array
        JsonNode songsArray = rootNode.get("songs");
        Iterator<JsonNode> iter = songsArray.iterator();

        JsonNode currentNode;

        while (iter.hasNext()) {
            currentNode = iter.next();

            String title = currentNode.path("title").asText();
            String artist = currentNode.path("artist").asText();
            int year = currentNode.path("year").asInt();
            String album = currentNode.path("album").asText();
            String image_url = currentNode.path("img_url").asText();

            try {
                table.putItem(new Item().withPrimaryKey("title", title, "album", album).withNumber(
                        "year",year).withString("artist", artist).withString("image_url", image_url));
                System.out.println("PutItem succeeded: " + title + " - " + artist + " - " + album + " - " + year + " - " + image_url);

            }
            catch (Exception e) {
                System.err.println("Unable to add music: " + title + " - " + artist + " - " + album + " - " + year + " - " + image_url);
                System.err.println(e.getMessage());
                break;
            }
        }
        parser.close();
    }
}

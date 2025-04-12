import com.amazonaws.AmazonServiceException;
import com.amazonaws.SdkClientException;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Iterator;
import java.io.File;
import java.io.IOException;

/*
Code adapted from Week 3 lab code CreateBucket2
https://rmit.instructure.com/courses/141320/files/43744075?wrap=1
 */

public class DowloadUploadImages {

    public static void main(String[] args) throws IOException {
        Regions clientRegion = Regions.US_EAST_1;
        String bucketName = "cca1-group76-bucket";//e.g., sxxxxxxx-s3test
        String download_dir = "images/";

        try {
            AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withRegion(clientRegion)
                    .withCredentials(new ProfileCredentialsProvider("default"))
                    .build();

            Files.createDirectories(Paths.get(download_dir));

            // Read JSON file
            JsonParser parser = new JsonFactory().createParser(new File("2025a1.json"));
            JsonNode rootNode = new ObjectMapper().readTree(parser);

            // Navigate to "songs" array
            JsonNode songsArray = rootNode.get("songs");
            Iterator<JsonNode> iter = songsArray.iterator();

            JsonNode currentNode;

            while (iter.hasNext()) {
                currentNode = iter.next();
                String imageUrl = currentNode.path("img_url").asText();

                // Extract file name from URL
                String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
                String filePath = download_dir + fileName;

                if (downloadImage(imageUrl, filePath)) {
                    System.out.println("Downloaded: " + fileName);

                     uploadToS3(s3Client, bucketName, filePath, fileName);
                }
            }
            parser.close();
        } catch (AmazonServiceException e) {
            // The call was transmitted successfully, but Amazon S3 couldn't process
            // it, so it returned an error response.
            e.printStackTrace();
        } catch (SdkClientException e) {
            // Amazon S3 couldn't be contacted for a response, or the client
            // couldn't parse the response from Amazon S3.
            e.printStackTrace();
        }
    }

    /**
    * Download image from a given URL and save it locally
     */
    private static boolean downloadImage(String imageUrl, String savePath) {
        try (InputStream in = new URL(imageUrl).openStream();
             OutputStream out = Files.newOutputStream(Paths.get(savePath))) {

            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
            return true;
        } catch (IOException e) {
            System.err.println("Failed to download: " + imageUrl);
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Upload file to S3 Bucket
     */
    private static void uploadToS3(AmazonS3 s3Client, String bucketName, String filePath, String fileName) {
        try {
            File file = new File(filePath);
            PutObjectRequest request = new PutObjectRequest(bucketName, fileName, file);
            s3Client.putObject(request);
            System.out.println("Uploaded to S3 " + bucketName + ": " + fileName);
        } catch (AmazonServiceException e) {
            // The call was transmitted successfully, but Amazon S3 couldn't process
            // it, so it returned an error response.
            e.printStackTrace();
        } catch (SdkClientException e) {
            // Amazon S3 couldn't be contacted for a response, or the client
            // couldn't parse the response from Amazon S3.
            e.printStackTrace();
        }
    }
}


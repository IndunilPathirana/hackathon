const AWS = require("aws-sdk");
const config = require("../config");

// AWS S3 setup
const s3 = new AWS.S3({
  region: config.aws.region,
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});

// Helper function to upload file to S3 (without ACL)
async function uploadToS3(fileName, fileContent) {
  const params = {
    Bucket: config.aws.s3BucketName,
    Key: `tests/${fileName}`,
    Body: fileContent,
    // No ACL needed, bucket policy handles public access
  };
  const data = await s3.upload(params).promise();
  return data.Location; // public URL
}

module.exports = {
  uploadToS3,
};

// Load the SDK for JavaScript
const { S3Client, ListObjectsCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

// Set the Region 
let region = process.env.AWS_REGION || 'ca-central-1';
let s3Client = null;

let Bucket = null;  // aws-sdk uppercases this in bucket params
let Delimiter = '/';

function init(proj, reg) {
  delete s3Client;
  Bucket = proj || 'osssbox';
  region = reg || region;
  s3Client = new S3Client({ region });
}

// pass a collection name for 'where'
async function docList(Prefix) {
  let list = [ ];
  try {
    if (Prefix === '/')
      Prefix = '';
    else if (Prefix && !Prefix.endsWith('/')) {
      Prefix += '/';
    }
    let results = await s3Client.send(new ListObjectsCommand({ Delimiter, Bucket, Prefix }));
    if (results.CommonPrefixes && results.CommonPrefixes.length===1 && results.CommonPrefixes[0] === Prefix) {
      Prefix += '/';
      results = await s3Client.send(new ListObjectsCommand({ Delimiter, Bucket, Prefix }));
    }
    // console.log("Success", results);
    if (results.CommonPrefixes) { // any folders?
      for (let folder of results.CommonPrefixes) {
        let name = folder.Prefix.slice(Prefix.length);
        list.push({ name, size: 0, type: 'folder', modified: 0 });
      }
    }
    if (results.Contents) { // any files?
      for (let doc of results.Contents) {
        let name = doc.Key.slice(Prefix.length);
        if (name.length>0) {  // skip the current (parent) folder itself, specifed in Prefix
          list.push({ name, size: doc.Size, type: 'file', modified: doc.LastModified });
        }
      }
    }
  }
  catch (err) {
    console.log("List error:", err.message);
    list = [ ];
  }
  return list; // For unit tests.
}

// pass a collection name for 'where', a doc name for 'which'
async function docGet(what) {
  try {
    // Create a helper function to convert a ReadableStream to a string.
    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      });

    // Get the object} from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data = await s3Client.send(new GetObjectCommand({ Bucket, Key: what }));
    // return data; // For unit tests.
    // Convert the ReadableStream to a string.
    const bodyContents = await streamToString(data.Body);
    console.log(bodyContents);
    return bodyContents;
  } catch (err) {
    console.log("Read error:", err.message);
  }
}

module.exports = { init, docList, docGet }
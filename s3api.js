// Load the SDK for JavaScript
const { S3Client, ListObjectsCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

// Set the AWS context
let accessKeyId = process.env.AWS_ACCESS_KEY_ID;
let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
let region = process.env.AWS_REGION_ID;
let bucket = process.env.AWS_BUCKET;

let Delimiter = '/';
let s3Client;

function init(_region, _access, _secret, _bucket) {
  if (s3Client) delete s3Client;

  region = _region || region;
  accessKeyId = _access || accessKeyId;
  secretAccessKey = _secret || secretAccessKey;

  bucket = _bucket || bucket; // also save this if specified here

  let credentials;
  if (accessKeyId && secretAccessKey) {
    credentials = { accessKeyId, secretAccessKey };
  }

  if (!region) throw new Error('Region not specified, e.g. "us-east-1"');

  s3Client = new S3Client({ region, credentials });
}

function setAccessKey(_key) {
  accessKeyId = _key;
  if (s3Client) init();
}
function setSecretAccessKey(_key) {
  secretAccessKey = _key;
  if (s3Client) init();
}
function setRegion(_region) {
  region = _region;
  if (s3Client) init();
}
function setBucket(_bucket) {
  bucket = _bucket;
  // no need to init for a bucket name change
}

function normalizePrefix(Prefix) {
  if ((Prefix === '/') || (Prefix === '~') || (Prefix === '~/')) {
    Prefix = '';
  } else if (Prefix && !Prefix.endsWith('/')) {
    Prefix += '/';
  }

  if (Prefix && Prefix.startsWith('~/')) {
    Prefix = Prefix.slice(2);
  } else
  if (Prefix && Prefix.startsWith('/')) {
    Prefix = Prefix.slice(1);
  }

  return Prefix;
}

// pass a collection name for 'where'
async function docList(_prefix, _bucket) {
  let list = [ ];
  let Bucket = _bucket || bucket;
  try {
    let Prefix = normalizePrefix(_prefix);
    let results = await s3Client.send(new ListObjectsCommand({ Delimiter, Bucket, Prefix }));
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
    console.error("List error:", err.stack || err.message);
    list = [ ];
  }
  return list; // For unit tests.
}

// Retrieve the file 'Key' in '_bucket'.
async function docGet(Key, _bucket) {
  let Bucket = _bucket || bucket;
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
    const data = await s3Client.send(new GetObjectCommand({ Bucket, Key }));
    // return data; // For unit tests.
    // Convert the ReadableStream to a string.
    const bodyContents = await streamToString(data.Body);
    // console.log(bodyContents);
    return bodyContents;
  } catch (err) {
    console.log("Read error:", err.message);
  }
}

module.exports = { 
  setAccessKey, setSecretAccessKey,
  setRegion, setBucket,
  init, normalizePrefix,
  docList, docGet
}
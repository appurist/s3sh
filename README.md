# s3sh
A shell for testing AWS S3 SDK operations.

This is really just a rough test program for checking the semantics of the AWS SDK's interface calls to S3.

It may be useful but it's not intended for real use. It does not support any form of upload/copy to S3, or download, although it does support a cat/type command to see text files and generic traversal commands like ls, cd, pwd, etc.  It might be useful to see how to implement such a thing in your own calls to the SDK. (Hint: set `Delimiter` and use `Prefix`.)

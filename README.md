# api-key-backup-poc
A proof-of-concept of using code for backing up AWS API keys, usage plans, and attachments and restoring them. This was intended for eventual use in a scheduled backup using the Event Bridge, as well as a REST API for manually restoring the backup from the latest, or a specific version if needed.  The backup is a JSON object that is base64-encoded, then gzipped, then shoved into Parameter Store as a secret file.

This capability is a missing feature in AWS, so we built one ourselves :)

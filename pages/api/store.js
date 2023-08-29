import formidable from "formidable";
import { Storage } from "@google-cloud/storage";
import path from "path";

const stream = require("stream");

export default async (req, res) => {
  try {
    let body = req.body;
    console.log("BODY", body);
    const jsonDirectory = path.join(process.cwd(), "restricted");

    const storage = new Storage({
      keyFilename: jsonDirectory + "/keyfile.json"
    });
    const myBucket = storage.bucket("imgfunnels.com");

    const form = formidable({
      multiples: true,
      allowEmptyFiles: true,
      minFileSize: 0,
      maxFileSize: 1024 * 1024 * 1024
    });

    let row = {
      datetime: void 0,
      content: void 0,
      link: void 0,
      images: [],
      gif: [],
      videos: []
    };

    form.onPart = async function (part) {
      // Only the files
      if (part.mimetype) {
        // console.log("FILE", part);

        if (part.originalFilename) {
          const passthroughStream = new stream.PassThrough();

          let location = `assets/Social Media/${part.name}/${part.originalFilename}`;
          row[part.name].push(location);
          let file = myBucket.file(location);
          passthroughStream.pipe(file.createWriteStream()).on("finish", () => {
            console.log(`${part.originalFilename} uploaded to imgfunnels.com`);
          });

          part.on("error", function (err) {
            console.log(err);
          });
          part.on("aborted", function () {
            console.log("Aborted");
          });

          part.on("fileBegin", (formname, file) => {
            console.log("fileBegin");
          });

          part.on("file", (formname, file) => {
            console.log("file");
          });

          part.on("field", (fieldName, fieldValue) => {
            console.log("field");
          });

          part.on("data", (buffer) => {
            // do whatever you want here
            // console.log("CHUNK", buffer);
            passthroughStream.write(buffer);
          });

          part.on("end", () => {
            passthroughStream.end();
          });
        }
      } else {
        // console.log("FIELD", part);
        row[part.name] = part.value;
      }
    };

    await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        // console.log("PARSING...");
        // TODO: Handle fields
        if (err) {
          // console.log("Formidable rejected");
          reject(err);
        } else {
          // console.log("Formidable resolved", err, fields, files);
          resolve({ fields, files });
        }
      });
    });

    // console.log("ROW", row);

    res.status(200).send(row);
  } catch (error) {
    console.error("ERROR:", error);
    res.status(400).send({ success: false, error: error.message });
  }
};

export const config = {
  api: {
    bodyParser: false
  }
};

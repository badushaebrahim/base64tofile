const express = require('express');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const mime = require('mime-types');
const res = require('express/lib/response');
const xml2js =require('xml2js')
const jsonToGraphql = require('json-to-graphql');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { spawn } = require('child_process');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '5000mb' }));
// app.use(bodyParser.json());
// app.use(express.json({limit: '500mb'}));
app.post('/convert', (req, res) => {
	console.log("hit")
	const { data, format } = req.body;
	// console.log(req.body)s
	const fileTypes = {
	  'pdf': 'application/pdf',
	  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	  'xls': 'application/vnd.ms-excel',
	  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	  'doc': 'application/msword'
	  // add more file types as needed
	};
	console.log(fileTypes[format])
	if (fileTypes[format]) {
	  res.type(fileTypes[format]);
	  const buff = Buffer.from(data, 'base64');
	  res.send(buff);
	} else {
	  res.status(400).send('Invalid file type');
	}
      });
      
app.post('/converta', async (req, res) => {
  const { data, format } = req.body;
  const buffer = Buffer.from(data, 'base64');

  if (!buffer || buffer.length === 0) {
    return res.status(400).send('Invalid base64 string');
  }

  let image = sharp(buffer);

  if (format === 'png') {
    image = image.png();
  } else if (format === 'jpeg') {
    image = image.jpeg();
  } else if (format === 'gif') {
    image = image.gif();
  }
 
 
 
  else {
    return res.status(400).send('Unsupported file format');
  }

  const imageData = await image.toBuffer();

  const contentType = mime.contentType(`.${format}`);
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', `attachment; filename="file.${format}"`);
  res.send(imageData);
});

// app.use(express.static('public'));
app.get("/",(req,res)=>{
  res.sendFile(__dirname+"/public/index.html")
})

app.get("/xm",(req,res)=>{
  res.sendFile(__dirname+"/public/xml.html")
})
app.get("/pojoa",(req,res)=>{
  res.sendFile(__dirname+"/public/pojo.html")
})

// json to pojo 
app.post('/pojo', (req, res) => {
  const json = req.body.json;
  jsonToGraphql(json, { noArrays: true }).then((result) => {
    const zip = new JSZip();
    zip.file('MyClass.java', result);
    zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
      const fileName = 'pojo.zip';
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(content);
    });
  }).catch((err) => {
    res.status(400).send(`Error converting JSON to POJO: ${err}`);
  });
});

// json 
app.post('/pojos', (req, res) => {
  const json = req.body;
  if (!json) {
    return res.status(400).send('JSON data required');
  }

  // Create a temporary directory for the POJO files
  const tmpDir = fs.mkdtempSync('pojo-');
  const javaPackage = 'com.example.pojo';

  // Generate POJO files using jsonschema2pojo
  const jsonSchema2Pojo = spawn('jsonschema2pojo', [
    '-t', 'jackson2',
    '-s', tmpDir,
    '-p', javaPackage,
    '-R', 'GENERATE_TO_FILES',
    '-E', '-P',
    '-T', 'JSON',
    '-c', 'org.jsonschema2pojo.rules.RuleFactory$FormatRuleFactory',
    '-d', tmpDir,
    '-x', 'true',
    '-l', 'java',
    '-i', '-'
  ]);

  jsonSchema2Pojo.stdin.write(JSON.stringify(json));
  jsonSchema2Pojo.stdin.end();

  jsonSchema2Pojo.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).send(`jsonschema2pojo failed with code ${code}`);
    }

    // Create a ZIP file containing the POJO files
    const output = fs.createWriteStream('pojo.zip');
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      // Send the ZIP file to the client
      res.download('pojo.zip', 'pojo.zip', (err) => {
        if (err) {
          console.error(err);
        }

        // Delete the temporary directory and ZIP file
        fs.rmdirSync(tmpDir, { recursive: true });
        fs.unlinkSync('pojo.zip');
      });
    });

    archive.on('error', (err) => {
      console.error(err);
      res.status(500).send('Failed to create ZIP file');
    });

    archive.pipe(output);
    archive.directory(tmpDir, false);
    archive.finalize();
  });
});




// Convert XML to JSON
app.post('/convert-xml-to-json', (req, res) => {
  const xmlData = req.body.data;
  const parser = new xml2js.Parser();
  
  parser.parseString(xmlData, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(400).send('Invalid XML data');
    }
    
    res.json(result);
  });
});







app.listen(3000, () => {
  console.log('Server started on port 3000');
});

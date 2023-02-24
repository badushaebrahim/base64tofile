const express = require('express');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const mime = require('mime-types');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '5000mb' }));
// app.use(bodyParser.json());
// app.use(express.json({limit: '500mb'}));
app.post('/convert', (req, res) => {
	console.log("hit")
	const { data, format } = req.body;
	console.log(req.body)
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

app.use(express.static('public'));


app.listen(3000, () => {
  console.log('Server started on port 3000');
});

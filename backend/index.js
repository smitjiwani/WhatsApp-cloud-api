import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';
import mime from 'mime';
import {getMessages, createMessage} from './controllers/controller.js';
import messages from './models/model.js';

dotenv.config();

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;

const app = express();
const port = process.env.PORT || 5000;
const connectionUrl = process.env.MONGODB_URI;
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(cors());

mongoose.connect(connectionUrl)
    .then(() => app.listen(port, () => console.log(`Server running on port: ${port}`)))
    .catch((error) => console.log(error.message));

//can be added to a seprate file

app.get('/messages', getMessages);

app.post('/messages', createMessage);

app.post("/webhook", async (req, res) => {
    // log incoming messages
    console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

    // check if the webhook request contains a message
    // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
    const phone = req.body.entry?.[0]?.changes[0]?.value?.phone_number;

    // check if the incoming message contains text
    if (message?.type === "text") {
        // extract the business number to send the reply from it
        const business_phone_number_id =
            req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

        // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
        // add message to db directly
        const newMessage = new messages({
            message: message.text.body,
            user: phone
        });
        await newMessage.save();
        console.log("Message saved to db");

        // mark incoming message as read
        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
                messaging_product: "whatsapp",
                status: "read",
                message_id: message.id,
            },
        });
    }

    res.sendStatus(200);
});

app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // check the mode and token sent are correct
    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
        // respond with 200 OK and challenge token from the request
        res.status(200).send(challenge);
        console.log("Webhook verified successfully!");
    } else {
        // respond with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);
    }
});

app.get("/", (req, res) => {
    res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.post("/uploadmedia", upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    console.log(req.file.path);
    let file = fs.createReadStream(req.file.path);
    let type = file.type;
    let data = new FormData();
    data.append('messaging_product', 'whatsapp');
    data.append('file', file, {
        filename: req.file.originalname,
        contentType: type
    }
    )

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://graph.facebook.com/v19.0/300955449770510/media',
        headers: { 
          'Authorization': `Bearer ${GRAPH_API_TOKEN}`, 
          ...data.getHeaders()
        },
        data : data
      };
      
      axios.request(config)


      .then((response) => {

        console.log(JSON.stringify(response.data));
        const id = response.data.id;
        let data = JSON.stringify({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": "918850382695",
            "type": "image",
            "image": {
              "id": id
            }
          });
          
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://graph.facebook.com/v19.0/300955449770510/messages',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${GRAPH_API_TOKEN}`
            },
            data : data
          };
          
          axios.request(config)
          .then(async (response) => {
            console.log(JSON.stringify(response.data));
            const newMessage = new messages({
                message: `Image ${id} was sent`,
                user: "web"
            });
            await newMessage.save();
            console.log("Message saved to db");
          })
          .catch((error) => {
            console.log(error.response.data);
          });

      })
      .catch((error) => {
        console.log(error.response.data);
      });      
});

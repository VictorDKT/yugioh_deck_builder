const fs = require('fs');
const https = require('https');
const path = require('path');
const xml = require('xml2js');
const crypto = require('crypto');
const { getUserByToken } = require('./Controller/User');

const downloadImage = function (url, dest) {
    return new Promise((resolve, reject) => {
        let file = fs.createWriteStream(dest);

        https.get(url, function (response) {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download image. Status code: ${response.statusCode}`));
            }

            response.pipe(file);

            file.on('finish', function () {
                file.close(() => resolve(dest));
            });
        }).on('error', function (err) {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

function getImageBase64(id) {
    const filePath = path.join(__dirname, `../imgs/${id}.jpg`);

    if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
    }

    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    return base64Image;
}

function checkIsValidCardList(cards) {
    let result = true;

    cards.forEach(card=>{
        if (typeof card !== 'object' || card === null) {
            result = false;
        }
    
        const requiredProperties = {
            card_code: 'number',
            name: 'string',
            type: 'string',
            frameType: 'string',
            desc: 'string',
            race: 'string',
            quantity: 'number',
        };
    
        for (const [key, type] of Object.entries(requiredProperties)) {
            if (!(key in card) || typeof card[key] !== type) {

                result = false;
            }
        }
    });

    return result;
}

async function getCardsImages(cards) {
    const result = [];
    const promises = cards.map(async card=>{
        if(!fs.existsSync(`./imgs/${card.card_code}.jpg`)) { 
            await downloadImage(`https://images.ygoprodeck.com/images/cards/${card.card_code}.jpg`, `./imgs/${card.card_code}.jpg`, ()=>{});
            const response = getImageBase64(card.card_code);
            result.push({
                ...card,
                "img": response,
            });
        } else {
            const response = getImageBase64(card.card_code);
            result.push({
                ...card,
                "img": response,
            });
        }
    });

    await Promise.all(promises);

    return result;
}

function formatResponse(object, format, res) {
    if(format === "xml") {
        const builder = new xml.Builder();
        const xmlObj = builder.buildObject(object);

        res.header('Content-Type', 'application/xml');
        return res.send(xmlObj);
    } else {
        return res.json(object);
    }
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function authenticateToken(req, res, next) {
    const { response_format = "json" } = req.query;
    const authHeader = req.headers['authorization'];
    const [bearer, token] = authHeader && authHeader.split(' ');

    if(!token || !bearer || bearer !== "Bearer") { 
        return formatResponse({
            success: false,
            error: "Invalid token format"
        }, response_format, res);
    } else {
        const user = await getUserByToken({token});

        if(user) {
            req.user = user;
            next();
        } else {
            return formatResponse({
                success: false,
                error: "Unauthorized"
            }, response_format, res);
        }
    }
}

module.exports = { downloadImage, getImageBase64, checkIsValidCardList, getCardsImages, formatResponse, generateToken, authenticateToken };
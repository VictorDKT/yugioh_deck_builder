const express = require("express");
const bcrypt = require("bcrypt");
const protobuf = require('protobufjs');
const router = express.Router();
const fs = require("fs");
const path = require('path');
const {
  downloadImage,
  getImageBase64,
  checkIsValidCardList,
  getCardsImages,
  formatResponse,
  generateToken,
  authenticateToken,
} = require("./utils");
const {
  insertDeck,
  getDeck,
  deleteDeck,
  listDecks,
  listUserDecks,
  getDeckById,
} = require("./Controller/Deck");
const { insertCard, deleteCardsFromDeck } = require("./Controller/Card");
const { insertUser, getUserByLogin, updateUserToken } = require("./Controller/User");

const saltRounds = 10;

const protoPath = path.join(__dirname, 'message.proto');
let Card, CardList, ApiResponse;

protobuf.load(protoPath, (err, root) => {
  if (err) {
    throw err;
  }
  Card = root.lookupType('Card');
  CardList = root.lookupType('CardList');
  ApiResponse = root.lookupType('ApiResponse');
});

router.get("/list", async (req, res) => {
  const { limit = 10, offset = 0, name, response_format = "json" } = req.query;
  let reqUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&sort=name&num=${limit}&offset=${offset}${
    name ? `&fname=${name}` : ""
  }`;
  const response = await fetch(reqUrl);
  const data = await response.json();

  if (data.data && data.data.length > 0) {
    const promises = data.data.map(async (card) => {
      if (!fs.existsSync(`./imgs/${card.id}.jpg`)) {
        await downloadImage(
          card.card_images[0].image_url,
          `./imgs/${card.id}.jpg`,
          () => {}
        );
        const response = getImageBase64(card.id);

        //card.desc = card.desc.replaceAll("\n", ". ");
        //card.desc = card.desc.replaceAll(/\\/g, '');
        //card.name = card.name.replaceAll("\n", ". ");
        //card.name = card.name.replaceAll(/\\/g, '');

        return {
          card_code: card.card_code,
          name: card.name,
          type: card.type,
          frameType: card.frameType,
          desc: card.desc,
          atk: card.atk,
          def: card.def,
          level: card.level,
          race: card.race,
          attribute: card.attribute,
          scale: card.scale, 
          linkval: card.linkval,
          img: response,
        };
      } else {
        const response = getImageBase64(card.id);

        //card.desc = card.desc.replaceAll("\n", ". ");
        //card.desc = card.desc.replaceAll(/\\/g, '');
        //card.name = card.name.replaceAll("\n", ". ");
        //card.name = card.name.replaceAll(/\\/g, '');

        return {
          card_code: card.card_code,
          name: card.name,
          type: card.type,
          frameType: card.frameType,
          desc: card.desc,
          atk: card.atk,
          def: card.def,
          level: card.level,
          race: card.race,
          attribute: card.attribute,
          scale: card.scale, 
          linkval: card.linkval,
          img: response,
        };
      }
    });
    const result = await Promise.all(promises);
    /*return formatResponse({
      data: result,
      total_pages: data.meta.total_pages,
      success: true,
    }, response_format, res);*/
    const cards = result.map(payload => {
      const errMsg = Card.verify(payload);
      if (errMsg) {
        res.status(400).send(errMsg);
        return null;
      }
      return Card.create(payload);
    }).filter(message => message !== null);
    const cardListPayload = { cards };
    const cardListMessage = CardList.create(cardListPayload);

    const apiResponsePayload = {
      success: true,
      total_pages: data.meta.total_pages,
      data: cardListMessage
    };
    const apiResponseMessage = ApiResponse.create(apiResponsePayload);

    const buffer = ApiResponse.encode(apiResponseMessage).finish();

    res.setHeader('Content-Type', 'application/x-protobuf');
    res.send(buffer);
  } else {
    const result = []
    /*return formatResponse({
      data: [],
      success: true,
      total_pages: data.meta.total_pages,
    }, response_format, res);*/
    const cards = result.map(payload => {
      const errMsg = Card.verify(payload);
      if (errMsg) {
        res.status(400).send(errMsg);
        return null;
      }
      return Card.create(payload);
    }).filter(message => message !== null);
    const cardListPayload = { cards };
    const cardListMessage = CardList.create(cardListPayload);

    const apiResponsePayload = {
      success: true,
      total_pages: data.meta.total_pages,
      data: cardListMessage
    };
    const apiResponseMessage = ApiResponse.create(apiResponsePayload);

    const buffer = ApiResponse.encode(apiResponseMessage).finish();

    res.setHeader('Content-Type', 'application/x-protobuf');
    res.send(buffer);
  }
});

router.get("/deck", async (req, res) => {
  const { name, offset = 0, limit = 10, response_format = "json" } = req.query;
  const result = await listDecks({ name, offset, limit });

  return formatResponse(result, response_format, res);
});

router.get("/user_decks", authenticateToken, async (req, res) => {
  const { response_format = "json" } = req.query;
  const user_id = req.user.id;
  const result = await listUserDecks({ user_id });

  return formatResponse(result, response_format, res);
});

router.post("/deck", authenticateToken, async (req, res) => {
  const { response_format = "json" } = req.query;
  const { card_list, name } = req.body;
  const user_id = req.user.id;
  const isValidCardList = checkIsValidCardList(card_list);

  if (!isValidCardList) {
    return formatResponse({
      success: false,
      error: "Invalid cardlist format",
    }, response_format, res);
  }

  if (!name) {
    return formatResponse({
      success: false,
      error: "Name is a required property",
    }, response_format, res);
  }

  const deckId = await insertDeck({ name, user_id });

  card_list.forEach(async (card) => {
    await insertCard({ ...card, deck_id: deckId });
  });

  return formatResponse({
    data: "Deck created successfully",
    success: true,
  }, response_format, res);
});

router.delete("/deck/:id", authenticateToken, async (req, res) => {
  const { response_format = "json" } = req.query;
  const user_id = req.user.id;
  const { id } = req.params;

  const deck = (await getDeckById({id}))[0];
 
  if(deck.user_id === user_id) {
    await deleteDeck({ id });
    await deleteCardsFromDeck({ id });

    return formatResponse({
      data: "Deck deleted successfully",
      success: true,
    }, response_format, res);
  } else {
    return formatResponse({
      data: "Deck belongs to another user",
      success: true,
    }, response_format, res);
  }
});

router.get("/deck/:id", async (req, res) => {
  const { response_format = "json" } = req.query;
  const { id } = req.params;
  const result = await getDeck({ id });

  if (result && result.length > 0) {
    const deck = {
      name: result[0].deck_name,
      cards: [],
    };
    const formattedData = result.map((card) => {
      //card.desc = card.desc.replaceAll("\n", ". ");
      //card.desc = card.desc.replaceAll(/\\/g, '');
      //card.name = card.name.replaceAll("\n", ". ");
      //card.name = card.name.replaceAll(/\\/g, '');

      return card;
    });

    deck.cards = await getCardsImages(formattedData);

    return formatResponse(deck, response_format, res);
  } else {
    return formatResponse({
      success: false,
      error: "Invalid deck id",
    }, response_format, res);
  }
});

router.post("/user", async (req, res) => {
  const { response_format = "json" } = req.query;
  const { login, password } = req.body;

  const user = await getUserByLogin({login});

  if(!user) {
    const hash = await bcrypt.hash(password, saltRounds);

    await insertUser({ login, password: hash });

    return formatResponse({
      success: true,
      data: "User created successfully",
    }, response_format, res);
  } else {
    return formatResponse({
      success: true,
      data: "Login already exists",
    }, response_format, res);
  }
});

router.post("/login", async (req, res) => {
  const { response_format = "json" } = req.query;
  const { login, password } = req.body;

  const user = await getUserByLogin({login});

  if(user) {
    const hashResult = await bcrypt.compare(password, user.password);
    const token = generateToken();

    if(hashResult) {
      await updateUserToken({ login, token });

      return formatResponse({
        success: true,
        data: {
          login,
          token
        },
      }, response_format, res);
    } else {
      return formatResponse({
        success: true,
        data: "Invalid password",
      }, response_format, res);
    }
  } else {
    return formatResponse({
      success: true,
      data: "User not exists",
    }, response_format, res);
  }
});

module.exports = { router };
